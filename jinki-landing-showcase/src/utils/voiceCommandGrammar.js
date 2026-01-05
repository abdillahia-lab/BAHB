/**
 * Voice Command Grammar - Command Patterns and Actions
 *
 * Defines all recognizable voice commands in multiple languages
 * with pattern matching and actions
 */

export const voiceCommandGrammar = {
  'en-US': {
    // Navigation commands
    navigation: [
      {
        name: 'go_home',
        action: 'navigate',
        target: '/',
        patterns: ['go to home', 'go home', 'home', 'navigate home', 'main page'],
        description: 'Navigate to home page',
      },
      {
        name: 'go_pricing',
        action: 'navigate',
        target: '/pricing',
        patterns: ['go to pricing', 'pricing', 'show pricing', 'view pricing', 'pricing page'],
        description: 'Navigate to pricing page',
      },
      {
        name: 'go_features',
        action: 'navigate',
        target: '/features',
        patterns: ['go to features', 'features', 'show features', 'view features', 'features page'],
        description: 'Navigate to features page',
      },
      {
        name: 'go_about',
        action: 'navigate',
        target: '/about',
        patterns: ['go to about', 'about', 'about us', 'about page', 'company info'],
        description: 'Navigate to about page',
      },
      {
        name: 'go_contact',
        action: 'navigate',
        target: '/contact',
        patterns: ['go to contact', 'contact', 'contact us', 'get in touch', 'contact page'],
        description: 'Navigate to contact page',
      },
      {
        name: 'go_demo',
        action: 'navigate',
        target: '/demo',
        patterns: ['go to demo', 'demo', 'show demo', 'view demo', 'demo page'],
        description: 'Navigate to demo page',
      },
      {
        name: 'go_back',
        action: 'navigate',
        target: 'back',
        patterns: ['go back', 'back', 'previous', 'previous page'],
        description: 'Go to previous page',
      },
    ],

    // Search commands
    search: [
      {
        name: 'search',
        action: 'search',
        patterns: ['search for', 'find', 'look for', 'search', 'query'],
        description: 'Search for content',
      },
      {
        name: 'clear_search',
        action: 'clear_search',
        patterns: ['clear search', 'clear', 'reset search'],
        description: 'Clear search results',
      },
    ],

    // UI Control commands
    controls: [
      {
        name: 'scroll_up',
        action: 'scroll',
        direction: 'up',
        patterns: ['scroll up', 'scroll top', 'go to top', 'top of page'],
        description: 'Scroll page up',
      },
      {
        name: 'scroll_down',
        action: 'scroll',
        direction: 'down',
        patterns: ['scroll down', 'scroll bottom', 'go to bottom', 'bottom of page'],
        description: 'Scroll page down',
      },
      {
        name: 'toggle_menu',
        action: 'toggle_menu',
        patterns: ['toggle menu', 'open menu', 'close menu', 'menu', 'show menu'],
        description: 'Toggle navigation menu',
      },
      {
        name: 'toggle_voice',
        action: 'toggle_voice',
        patterns: ['toggle voice', 'disable voice', 'enable voice', 'voice off', 'voice on'],
        description: 'Toggle voice commands',
      },
      {
        name: 'toggle_audio',
        action: 'toggle_audio',
        patterns: ['toggle audio', 'mute', 'unmute', 'audio off', 'audio on'],
        description: 'Toggle audio',
      },
      {
        name: 'increase_volume',
        action: 'volume',
        direction: 'up',
        patterns: ['increase volume', 'volume up', 'louder'],
        description: 'Increase volume',
      },
      {
        name: 'decrease_volume',
        action: 'volume',
        direction: 'down',
        patterns: ['decrease volume', 'volume down', 'quieter'],
        description: 'Decrease volume',
      },
    ],

    // Demo & Interaction commands
    demo: [
      {
        name: 'start_demo',
        action: 'start_demo',
        patterns: ['start demo', 'begin demo', 'show demo', 'run demo', 'play demo'],
        description: 'Start interactive demo',
      },
      {
        name: 'stop_demo',
        action: 'stop_demo',
        patterns: ['stop demo', 'end demo', 'close demo', 'exit demo'],
        description: 'Stop interactive demo',
      },
      {
        name: 'next_demo',
        action: 'next_step',
        patterns: ['next', 'next step', 'continue', 'proceed'],
        description: 'Go to next demo step',
      },
      {
        name: 'previous_demo',
        action: 'previous_step',
        patterns: ['previous', 'previous step', 'back', 'go back'],
        description: 'Go to previous demo step',
      },
    ],

    // Help & Info commands
    help: [
      {
        name: 'help',
        action: 'show_help',
        patterns: ['help', 'help me', 'show help', 'what can i say', 'commands'],
        description: 'Show available commands',
      },
      {
        name: 'repeat',
        action: 'repeat',
        patterns: ['repeat that', 'say that again', 'repeat', 'again'],
        description: 'Repeat last action',
      },
      {
        name: 'confirm',
        action: 'confirm',
        patterns: ['yes', 'confirm', 'ok', 'okay', 'sure'],
        description: 'Confirm action',
      },
      {
        name: 'cancel',
        action: 'cancel',
        patterns: ['no', 'cancel', 'nevermind', 'forget it', 'stop'],
        description: 'Cancel action',
      },
    ],

    // Form commands
    form: [
      {
        name: 'submit_form',
        action: 'submit_form',
        patterns: ['submit', 'submit form', 'send', 'send form'],
        description: 'Submit form',
      },
      {
        name: 'clear_form',
        action: 'clear_form',
        patterns: ['clear form', 'reset form', 'clear all'],
        description: 'Clear form fields',
      },
    ],
  },

  'es-ES': {
    navigation: [
      {
        name: 'go_home',
        action: 'navigate',
        target: '/',
        patterns: ['ir a inicio', 'inicio', 'página principal', 'home'],
        description: 'Navegar a página de inicio',
      },
      {
        name: 'go_back',
        action: 'navigate',
        target: 'back',
        patterns: ['atrás', 'volver', 'página anterior'],
        description: 'Ir a la página anterior',
      },
    ],
    search: [
      {
        name: 'search',
        action: 'search',
        patterns: ['buscar', 'encontrar', 'buscar por'],
        description: 'Buscar contenido',
      },
    ],
  },

  'fr-FR': {
    navigation: [
      {
        name: 'go_home',
        action: 'navigate',
        target: '/',
        patterns: ['aller à accueil', 'accueil', 'page d\'accueil', 'home'],
        description: 'Naviguer vers la page d\'accueil',
      },
      {
        name: 'go_back',
        action: 'navigate',
        target: 'back',
        patterns: ['retour', 'page précédente', 'précédent'],
        description: 'Aller à la page précédente',
      },
    ],
    search: [
      {
        name: 'search',
        action: 'search',
        patterns: ['rechercher', 'chercher', 'trouver'],
        description: 'Rechercher du contenu',
      },
    ],
  },

  'de-DE': {
    navigation: [
      {
        name: 'go_home',
        action: 'navigate',
        target: '/',
        patterns: ['zur startseite', 'startseite', 'hauptseite', 'home'],
        description: 'Zur Startseite navigieren',
      },
      {
        name: 'go_back',
        action: 'navigate',
        target: 'back',
        patterns: ['zurück', 'zurück gehen', 'vorherige seite'],
        description: 'Zur vorherigen Seite gehen',
      },
    ],
    search: [
      {
        name: 'search',
        action: 'search',
        patterns: ['suchen', 'suche nach', 'finde'],
        description: 'Nach Inhalten suchen',
      },
    ],
  },

  'ja-JP': {
    navigation: [
      {
        name: 'go_home',
        action: 'navigate',
        target: '/',
        patterns: ['ホームに行く', 'ホーム', 'メインページ'],
        description: 'ホームページへ移動',
      },
      {
        name: 'go_back',
        action: 'navigate',
        target: 'back',
        patterns: ['戻る', '前のページ'],
        description: '前のページに戻る',
      },
    ],
    search: [
      {
        name: 'search',
        action: 'search',
        patterns: ['検索', '探す'],
        description: 'コンテンツを検索',
      },
    ],
  },

  'zh-CN': {
    navigation: [
      {
        name: 'go_home',
        action: 'navigate',
        target: '/',
        patterns: ['返回首页', '首页', '主页'],
        description: '导航到首页',
      },
      {
        name: 'go_back',
        action: 'navigate',
        target: 'back',
        patterns: ['返回', '上一页', '后退'],
        description: '返回上一页',
      },
    ],
    search: [
      {
        name: 'search',
        action: 'search',
        patterns: ['搜索', '查找'],
        description: '搜索内容',
      },
    ],
  },
}

/**
 * Get all commands for a language
 */
export function getAllCommands(language = 'en-US') {
  const grammar = voiceCommandGrammar[language] || voiceCommandGrammar['en-US']
  return Object.values(grammar).flat()
}

/**
 * Format commands for display
 */
export function formatCommandsForDisplay(language = 'en-US') {
  const commands = getAllCommands(language)
  return commands.map((cmd) => ({
    name: cmd.name,
    description: cmd.description,
    examples: cmd.patterns.slice(0, 2),
  }))
}

export default voiceCommandGrammar
