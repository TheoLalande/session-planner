const { getDefaultConfig } = require('expo/metro-config')

const config = getDefaultConfig(__dirname)

config.resolver.platforms = ['ios', 'android']

module.exports = config
