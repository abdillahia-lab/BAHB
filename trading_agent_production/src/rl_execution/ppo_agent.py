"""
Proximal Policy Optimization (PPO) Agent for Order Execution

Implements PPO algorithm for learning optimal execution strategies.
Supports both discrete and continuous action spaces.
"""

import numpy as np
from dataclasses import dataclass, field
from typing import Any, Callable, Dict, List, Optional, Tuple
from abc import ABC, abstractmethod
import pickle
from datetime import datetime
import json


@dataclass
class PPOConfig:
    """PPO hyperparameters."""
    # Learning rates
    actor_lr: float = 3e-4
    critic_lr: float = 1e-3

    # PPO specific
    clip_epsilon: float = 0.2          # PPO clipping parameter
    entropy_coef: float = 0.01         # Entropy bonus coefficient
    value_loss_coef: float = 0.5       # Value function loss coefficient
    max_grad_norm: float = 0.5         # Gradient clipping

    # GAE parameters
    gamma: float = 0.99                # Discount factor
    gae_lambda: float = 0.95           # GAE lambda

    # Training parameters
    batch_size: int = 64               # Mini-batch size
    n_epochs: int = 10                 # Epochs per update
    rollout_length: int = 2048         # Steps per rollout

    # Network architecture
    hidden_sizes: Tuple[int, ...] = (256, 256)
    activation: str = "tanh"

    # Normalization
    normalize_advantages: bool = True
    normalize_returns: bool = False


@dataclass
class Rollout:
    """Storage for rollout data."""
    states: List[np.ndarray] = field(default_factory=list)
    actions: List[int] = field(default_factory=list)
    rewards: List[float] = field(default_factory=list)
    values: List[float] = field(default_factory=list)
    log_probs: List[float] = field(default_factory=list)
    dones: List[bool] = field(default_factory=list)

    def clear(self) -> None:
        """Clear all stored data."""
        self.states.clear()
        self.actions.clear()
        self.rewards.clear()
        self.values.clear()
        self.log_probs.clear()
        self.dones.clear()

    def add(
        self,
        state: np.ndarray,
        action: int,
        reward: float,
        value: float,
        log_prob: float,
        done: bool
    ) -> None:
        """Add a transition."""
        self.states.append(state)
        self.actions.append(action)
        self.rewards.append(reward)
        self.values.append(value)
        self.log_probs.append(log_prob)
        self.dones.append(done)

    def __len__(self) -> int:
        return len(self.states)


class NeuralNetwork:
    """
    Simple neural network implementation without external dependencies.

    Uses numpy for forward pass and gradient computation.
    For production, replace with PyTorch/TensorFlow.
    """

    def __init__(
        self,
        input_dim: int,
        hidden_sizes: Tuple[int, ...],
        output_dim: int,
        activation: str = "tanh"
    ):
        self.input_dim = input_dim
        self.hidden_sizes = hidden_sizes
        self.output_dim = output_dim

        # Initialize weights
        self.weights: List[np.ndarray] = []
        self.biases: List[np.ndarray] = []

        dims = [input_dim] + list(hidden_sizes) + [output_dim]

        for i in range(len(dims) - 1):
            # Xavier initialization
            scale = np.sqrt(2.0 / (dims[i] + dims[i + 1]))
            w = np.random.randn(dims[i], dims[i + 1]) * scale
            b = np.zeros(dims[i + 1])
            self.weights.append(w)
            self.biases.append(b)

        self.activation = activation
        self._activations: List[np.ndarray] = []

    def _activate(self, x: np.ndarray, final: bool = False) -> np.ndarray:
        """Apply activation function."""
        if final:
            return x  # Linear output

        if self.activation == "tanh":
            return np.tanh(x)
        elif self.activation == "relu":
            return np.maximum(0, x)
        elif self.activation == "sigmoid":
            return 1 / (1 + np.exp(-np.clip(x, -500, 500)))
        else:
            return x

    def forward(self, x: np.ndarray) -> np.ndarray:
        """Forward pass."""
        self._activations = [x]

        for i, (w, b) in enumerate(zip(self.weights, self.biases)):
            x = x @ w + b
            is_final = (i == len(self.weights) - 1)
            x = self._activate(x, final=is_final)
            self._activations.append(x)

        return x

    def get_params(self) -> List[np.ndarray]:
        """Get all parameters as flat array."""
        params = []
        for w, b in zip(self.weights, self.biases):
            params.append(w.flatten())
            params.append(b.flatten())
        return np.concatenate(params)

    def set_params(self, params: np.ndarray) -> None:
        """Set parameters from flat array."""
        idx = 0
        for i, (w, b) in enumerate(zip(self.weights, self.biases)):
            w_size = w.size
            b_size = b.size

            self.weights[i] = params[idx:idx + w_size].reshape(w.shape)
            idx += w_size

            self.biases[i] = params[idx:idx + b_size].reshape(b.shape)
            idx += b_size


class ActorCritic:
    """
    Actor-Critic network for PPO.

    Actor: Policy network outputting action probabilities
    Critic: Value network estimating state values
    """

    def __init__(
        self,
        state_dim: int,
        action_dim: int,
        config: PPOConfig
    ):
        self.state_dim = state_dim
        self.action_dim = action_dim
        self.config = config

        # Actor network (policy)
        self.actor = NeuralNetwork(
            input_dim=state_dim,
            hidden_sizes=config.hidden_sizes,
            output_dim=action_dim,
            activation=config.activation
        )

        # Critic network (value function)
        self.critic = NeuralNetwork(
            input_dim=state_dim,
            hidden_sizes=config.hidden_sizes,
            output_dim=1,
            activation=config.activation
        )

        # Adam optimizer states
        self.actor_m = np.zeros_like(self.actor.get_params())
        self.actor_v = np.zeros_like(self.actor.get_params())
        self.critic_m = np.zeros_like(self.critic.get_params())
        self.critic_v = np.zeros_like(self.critic.get_params())
        self.t = 0

    def get_action_probs(self, state: np.ndarray) -> np.ndarray:
        """Get action probabilities from policy."""
        logits = self.actor.forward(state)
        # Softmax with numerical stability
        logits = logits - np.max(logits, axis=-1, keepdims=True)
        exp_logits = np.exp(logits)
        probs = exp_logits / np.sum(exp_logits, axis=-1, keepdims=True)
        return probs

    def get_value(self, state: np.ndarray) -> float:
        """Get value estimate for state."""
        value = self.critic.forward(state)
        return float(value.squeeze())

    def sample_action(self, state: np.ndarray) -> Tuple[int, float]:
        """Sample action from policy and return log probability."""
        probs = self.get_action_probs(state)

        # Sample from categorical distribution
        action = np.random.choice(self.action_dim, p=probs.flatten())

        # Log probability
        log_prob = np.log(probs.flatten()[action] + 1e-10)

        return action, float(log_prob)

    def evaluate_actions(
        self,
        states: np.ndarray,
        actions: np.ndarray
    ) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """
        Evaluate actions for given states.

        Returns:
            (values, log_probs, entropy)
        """
        batch_size = states.shape[0]

        values = np.zeros(batch_size)
        log_probs = np.zeros(batch_size)
        entropy = np.zeros(batch_size)

        for i in range(batch_size):
            state = states[i:i+1]
            action = int(actions[i])

            # Get value
            values[i] = self.get_value(state)

            # Get action probabilities
            probs = self.get_action_probs(state).flatten()

            # Log probability of taken action
            log_probs[i] = np.log(probs[action] + 1e-10)

            # Entropy
            entropy[i] = -np.sum(probs * np.log(probs + 1e-10))

        return values, log_probs, entropy


class PPOAgent:
    """
    Proximal Policy Optimization agent.

    Implements the PPO-Clip algorithm for learning execution policies.
    """

    def __init__(
        self,
        state_dim: int,
        action_dim: int,
        config: Optional[PPOConfig] = None
    ):
        self.state_dim = state_dim
        self.action_dim = action_dim
        self.config = config or PPOConfig()

        self.ac = ActorCritic(state_dim, action_dim, self.config)

        # Training statistics
        self.training_stats: Dict[str, List[float]] = {
            'policy_loss': [],
            'value_loss': [],
            'entropy': [],
            'total_loss': [],
            'approx_kl': [],
            'clip_fraction': [],
        }

    def select_action(
        self,
        state: np.ndarray,
        deterministic: bool = False
    ) -> Tuple[int, float, float]:
        """
        Select action given state.

        Args:
            state: Current state
            deterministic: If True, select argmax action

        Returns:
            (action, log_prob, value)
        """
        if deterministic:
            probs = self.ac.get_action_probs(state)
            action = int(np.argmax(probs))
            log_prob = float(np.log(probs.flatten()[action] + 1e-10))
        else:
            action, log_prob = self.ac.sample_action(state)

        value = self.ac.get_value(state)

        return action, log_prob, value

    def compute_gae(
        self,
        rewards: np.ndarray,
        values: np.ndarray,
        dones: np.ndarray,
        last_value: float
    ) -> Tuple[np.ndarray, np.ndarray]:
        """
        Compute Generalized Advantage Estimation.

        Returns:
            (advantages, returns)
        """
        n_steps = len(rewards)
        advantages = np.zeros(n_steps)
        returns = np.zeros(n_steps)

        gae = 0.0
        next_value = last_value

        for t in reversed(range(n_steps)):
            if dones[t]:
                delta = rewards[t] - values[t]
                gae = delta
            else:
                delta = rewards[t] + self.config.gamma * next_value - values[t]
                gae = delta + self.config.gamma * self.config.gae_lambda * gae

            advantages[t] = gae
            returns[t] = advantages[t] + values[t]
            next_value = values[t]

        return advantages, returns

    def update(self, rollout: Rollout, last_value: float) -> Dict[str, float]:
        """
        Perform PPO update.

        Args:
            rollout: Collected experience
            last_value: Value of final state

        Returns:
            Training statistics
        """
        # Convert to numpy arrays
        states = np.array(rollout.states)
        actions = np.array(rollout.actions)
        old_log_probs = np.array(rollout.log_probs)
        rewards = np.array(rollout.rewards)
        values = np.array(rollout.values)
        dones = np.array(rollout.dones)

        # Compute GAE
        advantages, returns = self.compute_gae(rewards, values, dones, last_value)

        # Normalize advantages
        if self.config.normalize_advantages:
            advantages = (advantages - advantages.mean()) / (advantages.std() + 1e-8)

        # Training metrics
        total_policy_loss = 0.0
        total_value_loss = 0.0
        total_entropy = 0.0
        total_kl = 0.0
        total_clip_frac = 0.0
        n_updates = 0

        n_samples = len(states)

        for epoch in range(self.config.n_epochs):
            # Random permutation for mini-batches
            indices = np.random.permutation(n_samples)

            for start in range(0, n_samples, self.config.batch_size):
                end = min(start + self.config.batch_size, n_samples)
                batch_indices = indices[start:end]

                batch_states = states[batch_indices]
                batch_actions = actions[batch_indices]
                batch_old_log_probs = old_log_probs[batch_indices]
                batch_advantages = advantages[batch_indices]
                batch_returns = returns[batch_indices]

                # Evaluate current policy
                batch_values, batch_log_probs, batch_entropy = self.ac.evaluate_actions(
                    batch_states, batch_actions
                )

                # Policy loss (PPO-Clip)
                ratio = np.exp(batch_log_probs - batch_old_log_probs)
                clipped_ratio = np.clip(
                    ratio,
                    1 - self.config.clip_epsilon,
                    1 + self.config.clip_epsilon
                )

                policy_loss_unclipped = -batch_advantages * ratio
                policy_loss_clipped = -batch_advantages * clipped_ratio
                policy_loss = np.mean(np.maximum(policy_loss_unclipped, policy_loss_clipped))

                # Value loss
                value_loss = np.mean((batch_values - batch_returns) ** 2)

                # Entropy bonus
                entropy_loss = -np.mean(batch_entropy)

                # Total loss
                total_loss = (
                    policy_loss +
                    self.config.value_loss_coef * value_loss +
                    self.config.entropy_coef * entropy_loss
                )

                # Compute gradients numerically (placeholder for backprop)
                # In production, use PyTorch/TensorFlow autograd
                self._update_networks(
                    batch_states,
                    batch_actions,
                    batch_advantages,
                    batch_returns,
                    batch_old_log_probs
                )

                # Track metrics
                total_policy_loss += policy_loss
                total_value_loss += value_loss
                total_entropy += np.mean(batch_entropy)

                # Approximate KL divergence
                approx_kl = np.mean(batch_old_log_probs - batch_log_probs)
                total_kl += approx_kl

                # Clip fraction
                clip_frac = np.mean(np.abs(ratio - 1.0) > self.config.clip_epsilon)
                total_clip_frac += clip_frac

                n_updates += 1

        # Average metrics
        stats = {
            'policy_loss': total_policy_loss / n_updates,
            'value_loss': total_value_loss / n_updates,
            'entropy': total_entropy / n_updates,
            'approx_kl': total_kl / n_updates,
            'clip_fraction': total_clip_frac / n_updates,
        }

        # Store in history
        for key, value in stats.items():
            self.training_stats[key].append(value)

        return stats

    def _update_networks(
        self,
        states: np.ndarray,
        actions: np.ndarray,
        advantages: np.ndarray,
        returns: np.ndarray,
        old_log_probs: np.ndarray
    ) -> None:
        """
        Update actor and critic networks.

        Uses numerical gradient estimation for demonstration.
        Replace with autograd in production.
        """
        self.ac.t += 1
        beta1, beta2 = 0.9, 0.999
        eps = 1e-8

        # Actor update
        actor_params = self.ac.actor.get_params()
        actor_grad = self._compute_actor_gradient(
            states, actions, advantages, old_log_probs
        )

        # Adam update for actor
        self.ac.actor_m = beta1 * self.ac.actor_m + (1 - beta1) * actor_grad
        self.ac.actor_v = beta2 * self.ac.actor_v + (1 - beta2) * (actor_grad ** 2)

        m_hat = self.ac.actor_m / (1 - beta1 ** self.ac.t)
        v_hat = self.ac.actor_v / (1 - beta2 ** self.ac.t)

        actor_params -= self.config.actor_lr * m_hat / (np.sqrt(v_hat) + eps)
        self.ac.actor.set_params(actor_params)

        # Critic update
        critic_params = self.ac.critic.get_params()
        critic_grad = self._compute_critic_gradient(states, returns)

        # Adam update for critic
        self.ac.critic_m = beta1 * self.ac.critic_m + (1 - beta1) * critic_grad
        self.ac.critic_v = beta2 * self.ac.critic_v + (1 - beta2) * (critic_grad ** 2)

        m_hat = self.ac.critic_m / (1 - beta1 ** self.ac.t)
        v_hat = self.ac.critic_v / (1 - beta2 ** self.ac.t)

        critic_params -= self.config.critic_lr * m_hat / (np.sqrt(v_hat) + eps)
        self.ac.critic.set_params(critic_params)

    def _compute_actor_gradient(
        self,
        states: np.ndarray,
        actions: np.ndarray,
        advantages: np.ndarray,
        old_log_probs: np.ndarray
    ) -> np.ndarray:
        """
        Compute actor gradient numerically.

        For production, use PyTorch autograd.
        """
        params = self.ac.actor.get_params()
        epsilon = 1e-5
        grad = np.zeros_like(params)

        # Numerical gradient (very slow, for demo only)
        # Sample a subset of parameters to estimate gradient direction
        n_samples = min(100, len(params))
        sample_indices = np.random.choice(len(params), n_samples, replace=False)

        for idx in sample_indices:
            params_plus = params.copy()
            params_plus[idx] += epsilon
            self.ac.actor.set_params(params_plus)
            loss_plus = self._actor_loss(states, actions, advantages, old_log_probs)

            params_minus = params.copy()
            params_minus[idx] -= epsilon
            self.ac.actor.set_params(params_minus)
            loss_minus = self._actor_loss(states, actions, advantages, old_log_probs)

            grad[idx] = (loss_plus - loss_minus) / (2 * epsilon)

        # Restore original params
        self.ac.actor.set_params(params)

        # Extrapolate gradient to all parameters
        avg_grad = np.mean(np.abs(grad[sample_indices]))
        grad = np.sign(grad) * avg_grad  # Simplified

        # Clip gradient
        grad_norm = np.linalg.norm(grad)
        if grad_norm > self.config.max_grad_norm:
            grad = grad * self.config.max_grad_norm / grad_norm

        return grad

    def _compute_critic_gradient(
        self,
        states: np.ndarray,
        returns: np.ndarray
    ) -> np.ndarray:
        """Compute critic gradient numerically."""
        params = self.ac.critic.get_params()
        epsilon = 1e-5
        grad = np.zeros_like(params)

        n_samples = min(100, len(params))
        sample_indices = np.random.choice(len(params), n_samples, replace=False)

        for idx in sample_indices:
            params_plus = params.copy()
            params_plus[idx] += epsilon
            self.ac.critic.set_params(params_plus)
            loss_plus = self._critic_loss(states, returns)

            params_minus = params.copy()
            params_minus[idx] -= epsilon
            self.ac.critic.set_params(params_minus)
            loss_minus = self._critic_loss(states, returns)

            grad[idx] = (loss_plus - loss_minus) / (2 * epsilon)

        self.ac.critic.set_params(params)

        avg_grad = np.mean(np.abs(grad[sample_indices]))
        grad = np.sign(grad) * avg_grad

        grad_norm = np.linalg.norm(grad)
        if grad_norm > self.config.max_grad_norm:
            grad = grad * self.config.max_grad_norm / grad_norm

        return grad

    def _actor_loss(
        self,
        states: np.ndarray,
        actions: np.ndarray,
        advantages: np.ndarray,
        old_log_probs: np.ndarray
    ) -> float:
        """Compute actor loss."""
        total_loss = 0.0

        for i in range(len(states)):
            probs = self.ac.get_action_probs(states[i:i+1]).flatten()
            log_prob = np.log(probs[int(actions[i])] + 1e-10)

            ratio = np.exp(log_prob - old_log_probs[i])
            clipped_ratio = np.clip(
                ratio,
                1 - self.config.clip_epsilon,
                1 + self.config.clip_epsilon
            )

            loss = max(-advantages[i] * ratio, -advantages[i] * clipped_ratio)
            total_loss += loss

            # Entropy bonus
            entropy = -np.sum(probs * np.log(probs + 1e-10))
            total_loss -= self.config.entropy_coef * entropy

        return total_loss / len(states)

    def _critic_loss(self, states: np.ndarray, returns: np.ndarray) -> float:
        """Compute critic loss."""
        total_loss = 0.0

        for i in range(len(states)):
            value = self.ac.get_value(states[i:i+1])
            total_loss += (value - returns[i]) ** 2

        return total_loss / len(states)

    def save(self, path: str) -> None:
        """Save agent to file."""
        data = {
            'state_dim': self.state_dim,
            'action_dim': self.action_dim,
            'config': self.config,
            'actor_params': self.ac.actor.get_params(),
            'critic_params': self.ac.critic.get_params(),
            'training_stats': self.training_stats,
        }
        with open(path, 'wb') as f:
            pickle.dump(data, f)

    @classmethod
    def load(cls, path: str) -> 'PPOAgent':
        """Load agent from file."""
        with open(path, 'rb') as f:
            data = pickle.load(f)

        agent = cls(
            state_dim=data['state_dim'],
            action_dim=data['action_dim'],
            config=data['config']
        )
        agent.ac.actor.set_params(data['actor_params'])
        agent.ac.critic.set_params(data['critic_params'])
        agent.training_stats = data['training_stats']

        return agent


class ExecutionTrainer:
    """
    Training loop for PPO execution agent.

    Handles rollout collection and agent updates.
    """

    def __init__(
        self,
        agent: PPOAgent,
        env: 'OrderExecutionEnv',
        config: Optional[PPOConfig] = None
    ):
        self.agent = agent
        self.env = env
        self.config = config or PPOConfig()

        self.episode_rewards: List[float] = []
        self.episode_shortfalls: List[float] = []
        self.episode_lengths: List[int] = []

    def collect_rollout(self) -> Tuple[Rollout, float]:
        """Collect rollout from environment."""
        rollout = Rollout()
        state = self.env.reset()

        episode_reward = 0.0
        episode_length = 0

        for _ in range(self.config.rollout_length):
            state_array = state.to_array()

            # Select action
            action, log_prob, value = self.agent.select_action(state_array)

            # Take step
            next_state, reward, done, info = self.env.step(action)

            # Store transition
            rollout.add(state_array, action, reward, value, log_prob, done)

            episode_reward += reward
            episode_length += 1

            if done:
                self.episode_rewards.append(episode_reward)
                self.episode_lengths.append(episode_length)

                if 'implementation_shortfall_bps' in info:
                    self.episode_shortfalls.append(info['implementation_shortfall_bps'])

                # Reset
                state = self.env.reset()
                episode_reward = 0.0
                episode_length = 0
            else:
                state = next_state

        # Get final value for GAE
        final_state_array = state.to_array()
        _, _, last_value = self.agent.select_action(final_state_array)

        return rollout, last_value

    def train(
        self,
        n_iterations: int,
        callback: Optional[Callable[[int, Dict], None]] = None
    ) -> Dict[str, List[float]]:
        """
        Train agent for specified iterations.

        Args:
            n_iterations: Number of training iterations
            callback: Optional callback(iteration, stats)

        Returns:
            Training history
        """
        history = {
            'episode_rewards': [],
            'episode_shortfalls': [],
            'policy_loss': [],
            'value_loss': [],
            'entropy': [],
        }

        for iteration in range(n_iterations):
            # Collect rollout
            rollout, last_value = self.collect_rollout()

            # Update agent
            stats = self.agent.update(rollout, last_value)

            # Record history
            if self.episode_rewards:
                avg_reward = np.mean(self.episode_rewards[-10:])
                history['episode_rewards'].append(avg_reward)

            if self.episode_shortfalls:
                avg_shortfall = np.mean(self.episode_shortfalls[-10:])
                history['episode_shortfalls'].append(avg_shortfall)

            history['policy_loss'].append(stats['policy_loss'])
            history['value_loss'].append(stats['value_loss'])
            history['entropy'].append(stats['entropy'])

            # Callback
            if callback:
                callback(iteration, {
                    **stats,
                    'avg_reward': history['episode_rewards'][-1] if history['episode_rewards'] else 0,
                    'avg_shortfall': history['episode_shortfalls'][-1] if history['episode_shortfalls'] else 0,
                })

            # Print progress
            if (iteration + 1) % 10 == 0:
                avg_reward = np.mean(self.episode_rewards[-10:]) if self.episode_rewards else 0
                avg_shortfall = np.mean(self.episode_shortfalls[-10:]) if self.episode_shortfalls else 0
                print(f"Iteration {iteration + 1}/{n_iterations}")
                print(f"  Avg Reward: {avg_reward:.2f}")
                print(f"  Avg Shortfall: {avg_shortfall:.2f} bps")
                print(f"  Policy Loss: {stats['policy_loss']:.4f}")
                print(f"  Entropy: {stats['entropy']:.4f}")

        return history


class MultiAssetExecutionAgent:
    """
    Execution agent that handles multiple assets.

    Coordinates execution across multiple symbols with
    portfolio-level constraints.
    """

    def __init__(
        self,
        agent_id: str,
        config: Optional[PPOConfig] = None
    ):
        self.agent_id = agent_id
        self.config = config or PPOConfig()

        # Per-asset agents (trained separately or shared)
        self.agents: Dict[str, PPOAgent] = {}
        self.shared_agent: Optional[PPOAgent] = None

        # Execution state
        self.active_executions: Dict[str, Dict] = {}

    def initialize_shared_agent(
        self,
        state_dim: int,
        action_dim: int
    ) -> None:
        """Initialize shared agent for all assets."""
        self.shared_agent = PPOAgent(state_dim, action_dim, self.config)

    def start_execution(
        self,
        symbol: str,
        target_quantity: float,
        side: str,
        urgency: float = 0.5,
        max_participation: float = 0.1
    ) -> str:
        """Start an execution order."""
        execution_id = f"{self.agent_id}_{symbol}_{datetime.utcnow().timestamp()}"

        self.active_executions[execution_id] = {
            'symbol': symbol,
            'target_quantity': target_quantity,
            'remaining_quantity': target_quantity,
            'side': side,
            'urgency': urgency,
            'max_participation': max_participation,
            'executed_quantity': 0.0,
            'average_price': 0.0,
            'total_cost': 0.0,
            'start_time': datetime.utcnow(),
            'fills': [],
        }

        return execution_id

    def get_action(
        self,
        execution_id: str,
        state: np.ndarray
    ) -> Tuple[int, float]:
        """Get execution action for given state."""
        if execution_id not in self.active_executions:
            raise ValueError(f"Unknown execution: {execution_id}")

        agent = self.shared_agent or self.agents.get(
            self.active_executions[execution_id]['symbol']
        )

        if agent is None:
            raise ValueError("No agent available for execution")

        action, log_prob, _ = agent.select_action(state, deterministic=True)
        return action, log_prob

    def record_fill(
        self,
        execution_id: str,
        fill_quantity: float,
        fill_price: float
    ) -> None:
        """Record an execution fill."""
        if execution_id not in self.active_executions:
            return

        exec_state = self.active_executions[execution_id]

        exec_state['executed_quantity'] += fill_quantity
        exec_state['remaining_quantity'] -= fill_quantity
        exec_state['total_cost'] += fill_quantity * fill_price
        exec_state['average_price'] = (
            exec_state['total_cost'] / exec_state['executed_quantity']
        )
        exec_state['fills'].append({
            'quantity': fill_quantity,
            'price': fill_price,
            'timestamp': datetime.utcnow().isoformat(),
        })

    def is_complete(self, execution_id: str) -> bool:
        """Check if execution is complete."""
        if execution_id not in self.active_executions:
            return True

        return self.active_executions[execution_id]['remaining_quantity'] <= 0

    def get_execution_summary(self, execution_id: str) -> Optional[Dict]:
        """Get execution summary."""
        if execution_id not in self.active_executions:
            return None

        exec_state = self.active_executions[execution_id]

        return {
            'execution_id': execution_id,
            'symbol': exec_state['symbol'],
            'side': exec_state['side'],
            'target_quantity': exec_state['target_quantity'],
            'executed_quantity': exec_state['executed_quantity'],
            'remaining_quantity': exec_state['remaining_quantity'],
            'average_price': exec_state['average_price'],
            'total_cost': exec_state['total_cost'],
            'n_fills': len(exec_state['fills']),
            'duration_seconds': (
                datetime.utcnow() - exec_state['start_time']
            ).total_seconds(),
        }
