'use strict';

const {
    dialogflow,
    Suggestions,
} = require('actions-on-google');

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const base = require('base-converter')

admin.initializeApp();

const app = dialogflow({debug: true});

const fullBase = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'

function filter(num) {
    var i = 0
    if (num === '0')
        return num
    for (var char of num) {
        if (char !== '0')
            break
        i++
    }
    return num.slice(i)
}

function check(num, b) {
    var parsed = parseInt(num, b)
    return (parsed.toString(b) === num)
}

app.middleware((conv) => {
    if (!conv.data.fallbackCount || !(conv.intent === 'Fallback')) {
      conv.data.fallbackCount = 0;
    }
});

app.intent('Welcome', (conv) => {
    const welcomeMessage = 'Welcome to Base Converter where ' +
    'you can convert specific number of any base to another base.' +
    ' Please tell me the number.';
    conv.ask(welcomeMessage);
});

app.intent('base converter', (conv, {number, baseFrom, baseTo}) => {
    var str = filter(number).toLowerCase()
    console.log(number, baseFrom, baseTo)
    if (check(str, baseFrom)) {
        const dec = base.genericToDec(str, fullBase.slice(0,baseFrom).toLowerCase())
        console.log(dec)
        const res = base.decToGeneric(dec, fullBase.slice(0,baseTo))
        conv.ask(`<speak>` +
                    `<say-as interpret-as="verbatim">${number}</say-as> base${baseFrom} = ` +
                    `<say-as interpret-as="verbatim">${res}</say-as> base${baseTo}` +
                `</speak>`)
    } else
        conv.ask(`<speak>` + 
                    `<say-as interpret-as="verbatim">${number}</say-as>` +
                    `does not belongs to base${baseFrom}` +
                `</speak>`)
    conv.ask('Do you want to convert another number?')
    if (conv.screen)
    conv.ask(new Suggestions('Yes','No'));
});

app.intent('base converter - yes', (conv) => {
    conv.ask(' Please tell me the number.')
});

app.intent(['Quit','base converter - no'], (conv) => {
    conv.close('Thanks for using Base Converter. See you soon!!')
});

app.intent('No Input', (conv) => {
    const repromptCount = parseInt(conv.arguments.get('REPROMPT_COUNT'));
    if (repromptCount === 0) {
      conv.ask(`Sorry, I can't hear you.`);
    } else if (repromptCount === 1) {
      conv.ask(`I'm sorry, I still can't hear you. Please tell me the number`);
    } else if (conv.arguments.get('IS_FINAL_REPROMPT')) {
      conv.close(`I'm sorry, I'm having trouble here. ` +
        'Maybe we should try this again later.');
    }
});

app.intent('Fallback', (conv) => {
    conv.data.fallbackCount++;
    if (conv.data.fallbackCount === 1) {
      conv.ask('Sorry, what was that?');
    } else if (conv.data.fallbackCount === 2) {
      conv.ask(`I didn't quite get that. You can tell me the number.`);
    } else {
      conv.close(`Sorry, I'm still having trouble. ` +
        `So let's stop here for now. Bye.`);
    }
});

exports.fulfillment = functions.https.onRequest(app);
