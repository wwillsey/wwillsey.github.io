module.exports = {
    "extends": ["airbnb", "plugin:import/errors", "plugin:import/warnings"],
    "settings": {
        'import/resolver': 'node',
        'import/parsers':  {
            'typescript-eslint-parser': [ '.ts', '.tsx' ]
        }
    },
    "plugins": [
        // "react",
        // "jsx-a11y",
        "import",
        "mocha"
    ],
    "rules": {
        "max-len": ["error", 130],
        "comma-dangle": ["error", "only-multiline"],
        "camelcase": ["error", {"properties": "never"}],
        "mocha/no-exclusive-tests": "error",
        "object-curly-newline": "off",
        "function-paren-newline": "off",
        "prefer-destructuring": "off",
        "indent": "off",
        "implicit-arrow-linebreak": "off"
    },
    "globals": {
        "logger": true
    },
    "env": {
        "node": true,
        "mocha": true
      }
};
