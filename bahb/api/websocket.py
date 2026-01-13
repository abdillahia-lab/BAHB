"""WebSocket manager for real-time data streaming.

Provides live updates for:
- Alert notifications
- Facility status changes
- Detection events
- Analysis progress
"""

from __future__ import annotations

import asyncio
import json
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Optional, Callable, Set, Any

from loguru import logger


class MessageType(Enum):
    """WebSocket message types."""
    ALERT = "alert"
    DETECTION = "detection"
    FACILITY_UPDATE = "facility_update"
    ANALYSIS_PROGRESS = "analysis_progress"
    PREDICTION = "prediction"
    SYSTEM_STATUS = "system_status"
    PING = "ping"
    PONG = "pong"


@dataclass
class WebSocketMessage:
    """WebSocket message structure."""
    type: MessageType
    data: dict
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())
    channel: Optional[str] = None

    def to_json(self) -> str:
        return json.dumps({
            "type": self.type.value,
            "data": self.data,
            "timestamp": self.timestamp,
            "channel": self.channel,
        })


@dataclass
class WebSocketClient:
    """Connected WebSocket client."""
    id: str
    connected_at: datetime
    subscriptions: Set[str] = field(default_factory=set)
    send_callback: Optional[Callable] = None
    is_active: bool = True
    messages_sent: int = 0
    messages_received: int = 0


class WebSocketManager:
    """
    Manage WebSocket connections and message routing.

    Features:
    - Channel-based subscriptions
    - Broadcast and targeted messaging
    - Connection health monitoring
    - Message queuing
    """

    def __init__(
        self,
        ping_interval_seconds: float = 30.0,
        max_message_queue: int = 100,
    ):
        self.clients: dict[str, WebSocketClient] = {}
        self.channels: dict[str, Set[str]] = {}  # channel -> client_ids
        self.ping_interval = ping_interval_seconds
        self.max_queue = max_message_queue

        # Message queues for clients
        self._queues: dict[str, asyncio.Queue] = {}

        # Stats
        self._total_messages_sent = 0
        self._total_connections = 0

    async def connect(
        self,
        client_id: str,
        send_callback: Optional[Callable] = None,
    ) -> WebSocketClient:
        """Register a new WebSocket connection."""
        client = WebSocketClient(
            id=client_id,
            connected_at=datetime.now(),
            send_callback=send_callback,
        )

        self.clients[client_id] = client
        self._queues[client_id] = asyncio.Queue(maxsize=self.max_queue)
        self._total_connections += 1

        logger.info(f"WebSocket client connected: {client_id}")

        # Start message processing for this client
        asyncio.create_task(self._process_client_queue(client_id))

        return client

    async def disconnect(self, client_id: str) -> None:
        """Disconnect a WebSocket client."""
        if client_id in self.clients:
            client = self.clients[client_id]
            client.is_active = False

            # Remove from all channels
            for channel in client.subscriptions:
                if channel in self.channels:
                    self.channels[channel].discard(client_id)

            del self.clients[client_id]

            if client_id in self._queues:
                del self._queues[client_id]

            logger.info(f"WebSocket client disconnected: {client_id}")

    async def subscribe(
        self,
        client_id: str,
        channel: str,
    ) -> bool:
        """Subscribe client to a channel."""
        if client_id not in self.clients:
            return False

        if channel not in self.channels:
            self.channels[channel] = set()

        self.channels[channel].add(client_id)
        self.clients[client_id].subscriptions.add(channel)

        logger.debug(f"Client {client_id} subscribed to {channel}")
        return True

    async def unsubscribe(
        self,
        client_id: str,
        channel: str,
    ) -> bool:
        """Unsubscribe client from a channel."""
        if client_id not in self.clients:
            return False

        if channel in self.channels:
            self.channels[channel].discard(client_id)

        self.clients[client_id].subscriptions.discard(channel)
        return True

    async def send(
        self,
        client_id: str,
        message: WebSocketMessage,
    ) -> bool:
        """Send message to specific client."""
        if client_id not in self.clients:
            return False

        client = self.clients[client_id]
        if not client.is_active:
            return False

        try:
            queue = self._queues.get(client_id)
            if queue:
                await queue.put(message)
                return True
        except asyncio.QueueFull:
            logger.warning(f"Message queue full for client {client_id}")

        return False

    async def broadcast(
        self,
        message: WebSocketMessage,
        channel: Optional[str] = None,
    ) -> int:
        """Broadcast message to all clients or channel subscribers."""
        sent_count = 0

        if channel:
            # Send to channel subscribers
            client_ids = self.channels.get(channel, set())
            message.channel = channel
        else:
            # Send to all clients
            client_ids = set(self.clients.keys())

        for client_id in client_ids:
            if await self.send(client_id, message):
                sent_count += 1

        self._total_messages_sent += sent_count
        return sent_count

    async def broadcast_alert(
        self,
        severity: str,
        title: str,
        message_text: str,
        facility_id: Optional[str] = None,
    ) -> int:
        """Broadcast alert to all subscribers."""
        message = WebSocketMessage(
            type=MessageType.ALERT,
            data={
                "severity": severity,
                "title": title,
                "message": message_text,
                "facility_id": facility_id,
            },
        )

        # Broadcast to alert channel
        return await self.broadcast(message, channel="alerts")

    async def broadcast_detection(
        self,
        facility_id: str,
        detection_data: dict,
    ) -> int:
        """Broadcast detection event."""
        message = WebSocketMessage(
            type=MessageType.DETECTION,
            data={
                "facility_id": facility_id,
                **detection_data,
            },
        )

        return await self.broadcast(message, channel=f"facility:{facility_id}")

    async def broadcast_facility_update(
        self,
        facility_id: str,
        update_data: dict,
    ) -> int:
        """Broadcast facility update."""
        message = WebSocketMessage(
            type=MessageType.FACILITY_UPDATE,
            data={
                "facility_id": facility_id,
                **update_data,
            },
        )

        # Broadcast to both general and facility-specific channels
        count = await self.broadcast(message, channel="facilities")
        count += await self.broadcast(message, channel=f"facility:{facility_id}")
        return count

    async def _process_client_queue(self, client_id: str) -> None:
        """Process message queue for a client."""
        while client_id in self.clients and self.clients[client_id].is_active:
            try:
                queue = self._queues.get(client_id)
                if not queue:
                    break

                message = await asyncio.wait_for(queue.get(), timeout=self.ping_interval)
                client = self.clients.get(client_id)

                if client and client.send_callback:
                    await client.send_callback(message.to_json())
                    client.messages_sent += 1

            except asyncio.TimeoutError:
                # Send ping
                await self._send_ping(client_id)
            except Exception as e:
                logger.error(f"Error processing queue for {client_id}: {e}")
                break

    async def _send_ping(self, client_id: str) -> None:
        """Send ping to keep connection alive."""
        client = self.clients.get(client_id)
        if client and client.send_callback:
            ping = WebSocketMessage(type=MessageType.PING, data={})
            try:
                await client.send_callback(ping.to_json())
            except Exception:
                # Connection may be dead
                await self.disconnect(client_id)

    async def handle_message(
        self,
        client_id: str,
        message: str,
    ) -> Optional[WebSocketMessage]:
        """Handle incoming message from client."""
        client = self.clients.get(client_id)
        if not client:
            return None

        client.messages_received += 1

        try:
            data = json.loads(message)
            msg_type = data.get("type", "")

            if msg_type == "pong":
                # Client responding to ping
                return None

            elif msg_type == "subscribe":
                channel = data.get("channel")
                if channel:
                    await self.subscribe(client_id, channel)
                return WebSocketMessage(
                    type=MessageType.SYSTEM_STATUS,
                    data={"subscribed": channel},
                )

            elif msg_type == "unsubscribe":
                channel = data.get("channel")
                if channel:
                    await self.unsubscribe(client_id, channel)
                return WebSocketMessage(
                    type=MessageType.SYSTEM_STATUS,
                    data={"unsubscribed": channel},
                )

        except json.JSONDecodeError:
            logger.warning(f"Invalid JSON from client {client_id}")

        return None

    def get_status(self) -> dict:
        """Get WebSocket manager status."""
        return {
            "connected_clients": len(self.clients),
            "active_channels": len(self.channels),
            "total_connections": self._total_connections,
            "total_messages_sent": self._total_messages_sent,
            "clients": [
                {
                    "id": c.id,
                    "connected_at": c.connected_at.isoformat(),
                    "subscriptions": list(c.subscriptions),
                    "messages_sent": c.messages_sent,
                    "messages_received": c.messages_received,
                }
                for c in self.clients.values()
            ],
            "channels": {
                name: len(clients)
                for name, clients in self.channels.items()
            },
        }
