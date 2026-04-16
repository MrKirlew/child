const globals = require('globals');

module.exports = [
  { ignores: ['**/node_modules/**'] },
  {
    files: ['api/**/*.js', 'server/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: { ...globals.node, fetch: 'readonly' }
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
      'no-undef': 'error',
      'eqeqeq': ['error', 'always'],
      'no-var': 'error',
      'no-eval': 'error',
      'no-implied-eval': 'error',
    }
  },
  {
    files: ['www/js/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: {
        ...globals.browser,
        // Shared state from index.html inline script
        S: 'writable', SUBS: 'readonly', EX_SUBS: 'readonly', EX_EMOJI: 'readonly', SCOL: 'readonly', GN: 'readonly', DN: 'readonly', SN: 'readonly',
        BADGES: 'readonly', VIZ: 'readonly', AI_PROXY: 'readonly',
        saveS: 'readonly', loadS: 'readonly', esc: 'readonly', fmt: 'readonly',
        addBub: 'readonly', addTyp: 'readonly', rmTyp: 'readonly', reportError: 'readonly', hashPin: 'readonly',
        // Cross-module globals
        NB: 'writable', CUREX: 'writable',
        speak: 'readonly', speakDirect: 'readonly', stopAll: 'readonly',
        onAndroidTTSDone: 'readonly',
        togLMic: 'readonly', micUI: 'readonly',
        connectLive: 'readonly', startConversation: 'readonly', stopConversation: 'readonly', sendLiveText: 'readonly',
        togExMic: 'readonly', stopEMic: 'readonly',
        onAndroidSpeechResult: 'readonly', onAndroidSpeechError: 'readonly',
        aiGenerate: 'readonly', sysPmt: 'readonly', sysPmtJSON: 'readonly', callAI: 'readonly', sendL: 'readonly', startLesson: 'readonly', _getDailyTokens: 'readonly',
        rememberConversationTurn: 'readonly', recordLearnActivity: 'readonly',
        newEx: 'readonly', renderEx: 'readonly', pickMC: 'readonly', submitFB: 'readonly',
        handleVoiceAns: 'readonly', checkVoice: 'readonly', finishEx: 'readonly',
        nextEx: 'readonly', resetSess: 'readonly', updScoreBar: 'readonly', renderExSubs: 'readonly', pickExSub: 'readonly',
        updProg: 'readonly', checkBadges: 'readonly',
        showTab: 'readonly', setDiff: 'readonly', pickGrade: 'readonly',
        closeAll: 'readonly', openGrade: 'readonly', openPin: 'readonly',
        chkPin: 'readonly', openDash: 'readonly', openChgPin: 'readonly', saveChgPin: 'readonly',
        acceptCoppa: 'readonly', startApp: 'readonly', setListenWait: 'readonly',
        sendTyped: 'readonly', spellWord: 'readonly', showSpellResult: 'readonly', togSpellMic: 'readonly',
        setMode: 'readonly',
        // Web APIs not in globals.browser
        SpeechRecognition: 'readonly', webkitSpeechRecognition: 'readonly',
      }
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^(?:_|[a-z])', caughtErrorsIgnorePattern: '^_' }],
      'no-undef': 'error',
      'eqeqeq': ['error', 'always'],
      'no-var': 'error',
      'no-eval': 'error',
      'no-implied-eval': 'error',
    }
  }
];
