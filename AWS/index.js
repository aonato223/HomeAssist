//Testing Version
'use strict';
//const Alexa = require('alexa-sdk');
var request = require('request');

//To use v2 and v1 sdk at the same time
const Alexa = require('ask-sdk-v1adapter');


//=========================================================================================================================================
//SDKv2 DynamoDb
const { DynamoDbPersistenceAdapter } = require('ask-sdk-dynamodb-persistence-adapter');
const persistenceAdapter = new DynamoDbPersistenceAdapter({
  tableName: 'Reminders',
  createTable: true
});
//=========================================================================================================================================

///////////////////////
const messages = {
  WELCOME: 'Welcome to the Reminders API Demo Skill!  You can say "create a reminder" to create a reminder.  What would you like to do?',
  WHAT_DO_YOU_WANT: 'What would you like to do?',
  NOTIFY_MISSING_PERMISSIONS: 'Please enable Reminder permissions in the Amazon Alexa app using the card I\'ve sent to your Alexa app.',
  ERROR: 'Uh Oh. Looks like something went wrong.',
  API_FAILURE: 'There was an error with the Reminders API.',
  GOODBYE: 'Bye! Thanks for using the Reminders API Skill!',
  UNHANDLED: 'This skill doesn\'t support that. Please ask something else.',
  HELP: 'You can use this skill by asking something like: create a reminder?',
  REMINDER_CREATED: 'OK, I will remind you in 30 seconds.',
  UNSUPPORTED_DEVICE: 'Sorry, this device doesn\'t support reminders.',
  WELCOME_REMINDER_COUNT: 'Welcome to the Reminders API Demo Skill.  The number of your reminders related to this skill is ',
  NO_REMINDER: 'OK, I won\'t remind you.',
};
//////////////////////

//Replace with your app ID (OPTIONAL).  You can find this value at the top of your skill's page on http://developer.amazon.com.
//Make sure to enclose your value in quotes, like this: const APP_ID = 'amzn1.ask.skill.bb4045e6-b3e8-4133-b650-72923c5980f1';
const APP_ID = undefined;

const SKILL_NAME = 'Home Assist';
const HELP_MESSAGE = 'You can say I want to input my data';
const HELP_REPROMPT = 'What can I help you with?';
const STOP_MESSAGE = 'Goodbye!';

//=========================================================================================================================================
//Editing anything below this line might break your skill.
//=========================================================================================================================================
//const skillBuilder = Alexa.SkillBuilders.custom();

exports.handler = function (event, context, callback) {
    const alexa = Alexa.handler(event, context, callback);
	//const alexa2 = Alexav2.handler(event, context, callback);
    alexa.dynamoDBTableName = 'HealthScores';
	alexa.dynamoDBTableName = 'Meals';
    alexa.APP_ID = APP_ID;
    alexa.registerHandlers(handlers);
	
    //alexa.registerV2Handlers(HelloWorldIntentHandler, CreateReminderHandler); // New API functions for registering v2 request handlers
    alexa.registerV2Handlers(CreateReminderHandler);
    
    //alexa.registerV2Handlers(HelloWorldIntentHandler, CreateReminderHandler).withPersistenceAdapter(persistenceAdapter);
	
    alexa.execute();
};


function url(id, feeling, sleeping, breathing, swollen) {
    // return "http://en.wikipedia.org/w/api.php?action=query&format=json&list=search&utf8=1&srsearch=Albert+Einstein"
    //     const guessNum = parseInt(requestEnvelope.request.intent.slots.num.value, 10);
        return 'http://cms3.dclhealth.com/alexa_get/alexa_get_insert.php?patient_id='+id+'&response1='+feeling+'&response2='+sleeping+'&response3='+breathing+'&response4='+swollen;

}

function url2(token){
    return 'https://api.amazon.com/user/profile?access_token=' + token;
}

var myId = null;
var uId = null;

var fScore = null;
var sScore = null;

/* 
Testing: Temporary using global values to pass slots from one intent into another.
	Due to previous multi-dialog function is on sdk v1 while newer functions are on sdk v2
	Use session attributes to pass slot values, in order to fix this
*/
var globFeel = null;
var globSleep = null;
var globBreath = null;
var globSwol = null;

var globFood = null;
var globDate = null;
var globTime = null;

const PERMISSIONS = ['alexa::alerts:reminders:skill:readwrite'];

const handlers = {
    // 'LaunchRequest': function () {

    //     this.emit('HomeAssistQuestions');

    // },
    'LaunchRequest': function () {
        //this.emit(':ask', 'Welcome to your home assist', 'Try calling for help to know your commands');
        //this.emit(':ask', 'Welcome to your home assist you may start by saying record my stats or asking for help to know more commands LINKING TEST Axio installed', 'Try calling for help to know your commands');
		
		const accessToken = this.event.context.System.user.accessToken;

			if (accessToken == undefined){
				this.emit(':ask', 'Link your account through the Alexa app', 'Try calling for help to know your commands');
		} else {
	/*   Amazon Login Only
	
        //this.emit(':ask', accessToken, 'Try calling for help to know your commands');
		let urlLink = 'https://api.amazon.com/user/profile?access_token=' + accessToken;
		    request.get(urlLink, (err, res, body) => {  
						//this.emit(':ask', 'Welcome to your home assist master', 'Try calling for help to know your commands');
				let dataLink = JSON.parse(body);
				myId = dataLink.name;
				var fName = myId.substr(0,myId.indexOf(' '));
				var amazonId = dataLink.user_id;
				uId = amazonId.substring(amazonId.length-4);
				this.emit(':ask','Hello ' +  fName + ' welcome to home assist', 'Try calling for help to know your commands');
				
             });
			*/

		let urlLink = 'https://onatocsula.auth0.com/userinfo?access_token=' + accessToken;
		    request.get(urlLink, (err, res, body) => {  
						//this.emit(':ask', 'Welcome to your home assist master', 'Try calling for help to know your commands');
				let dataLink = JSON.parse(body);
				myId = dataLink.name;
				var fName = myId.substr(0,myId.indexOf(' '));
				var oAuthId = dataLink.sub;
				uId = oAuthId.substring(oAuthId.length-4);
				this.emit(':ask','Hello ' +  fName + uId + ' welcome to home assist', 'Try calling for help to know your commands');
				
             });

		}
	
	},
    'HomeAssistQuestions': function () {

        this.attributes.healthscores = {
            'patientID' : 0,
            'scores': {
                'feeling': {
                    'score': 0
                },
                'sleeping': {
                    'score': 0
                },
                'breathing': {
                    'score': 0
                },
                'swollen': {
                    'score': 0
                }
            },

        };

		if(this.event.request.dialogState !== 'COMPLETED'){	
			
			const accessToken = this.event.context.System.user.accessToken;
            
            //     Original emit delegate (working)
            // //ID
            // if (this.event.request.intent.slots.id.value == '?') {
            //     let prompt = "Sorry I didn't hear your ID number";
            //     let reprompt = "Can you give me your ID number";
            //     this.emit(':elicitSlot', 'id', prompt, reprompt); 
            // }
            // //Feeling
            // else if (this.event.request.intent.slots.feelingRating.value == '?' || this.event.request.intent.slots.feelingRating.value < 1 || this.event.request.intent.slots.feelingRating.value > 10) { 
            // //else if (this.event.request.intent.slots.feelingRating.resolutions.resolutionsPerAuthority[0].status.code == 'ER_SUCCESS_NO_MATCH') {             
            //     let prompt = "Sorry I didn't hear rating for how you feel or you didnt't give me a number from one to ten";
            //     let reprompt = "Tell me how you feel from one to ten";
            //     this.emit(':elicitSlot', 'feelingRating', prompt, reprompt); 
            // } 
            // //Sleeping
            // else if (this.event.request.intent.slots.sleepingRating.value == '?' || this.event.request.intent.slots.sleepingRating.value < 1 || this.event.request.intent.slots.sleepingRating.value > 10) {
            //     let prompt = "Sorry I didn't hear your rating for your sleeping score or you didnt't give me a number from one to ten";
            //     let reprompt = "Tell me how you feel from one to ten";
            //     this.emit(':elicitSlot', 'sleepingRating', prompt, reprompt);
            // } 
            // //Breathing
            // else if (this.event.request.intent.slots.breathingRating.value == '?' || this.event.request.intent.slots.breathingRating.value < 1 || this.event.request.intent.slots.breathingRating.value > 10) {
            //     let prompt = "Sorry I didn't hear your breathing rating or you didnt't give me a number from one to ten";
            //     let reprompt = "Tell me how you feel from one to ten";
            //     this.emit(':elicitSlot', 'breathingRating', prompt, reprompt); 
            // } 
            // //Swollen
            // else if (this.event.request.intent.slots.SwollenRating.value == '?' || this.event.request.intent.slots.SwollenRating.value < 1 || this.event.request.intent.slots.SwollenRating.value > 10) {
            //     let prompt = "Sorry I didn't hear rating for your swollen rating or you didnt't give me a number from one to ten";
            //     let reprompt = "Tell me how you feel from one to ten";
            //     this.emit(':elicitSlot', 'SwollenRating', prompt, reprompt); 
            // }
            // else{
            //     this.emit(':delegate');
            // }
            

           
        
            //manually emit and confirm
            
            //Require slot data
            //if (!this.event.request.intent.slots.id.value) {
                //let prompt = "What is your ID tester";
                //let reprompt = "Can you give me your patient ID number";
                //return this.emit(':elicitSlot', 'id', prompt, reprompt); 
            //}
           //else if (this.event.request.intent.slots.id.value == '?') {
                //let prompt = "Sorry I didn't hear your ID number";
                //let reprompt = "Can you give me your ID number";
                //return this.emit(':elicitSlot', 'id', prompt, reprompt); 
            //}
            
			
			
////////////////////////
			

			if (accessToken == undefined){
		        if (!this.event.request.intent.slots.id.value) {
				
                let prompt = "What is your ID tester";
                let reprompt = "Can you give me your patient ID number";
                return this.emit(':elicitSlot', 'id', prompt, reprompt); 
            }
            else if (this.event.request.intent.slots.id.value == '?') {
				
                let prompt = "Sorry I didn't hear your ID number";
                let reprompt = "Can you give me your ID number";
                return this.emit(':elicitSlot', 'id', prompt, reprompt); 
            }
			
		} 
			
///////////////////////
            //Feeling
            if (!this.event.request.intent.slots.feelingRating.value) { 
            //else if (this.event.request.intent.slots.feelingRating.resolutions.resolutionsPerAuthority[0].status.code == 'ER_SUCCESS_NO_MATCH') {  


				
                let prompt = "From one to ten how do you feel";
                let reprompt = "Tell me how you feel from one to ten";
                return this.emit(':elicitSlot', 'feelingRating', prompt, reprompt); 
            }
            //else if (this.event.request.intent.slots.feelingRating.value == '?' || this.event.request.intent.slots.feelingRating.value < 1 || this.event.request.intent.slots.feelingRating.value > 10) { 
            
            //If this is on, then the developer console must have this slot, on every intent change into the custom type!!
            else if (this.event.request.intent.slots.feelingRating.resolutions.resolutionsPerAuthority[0].status.code == 'ER_SUCCESS_NO_MATCH') {             
                let prompt = "Sorry I didn't hear rating for how you feel or you didnt't give me a number from one to ten";
                let reprompt = "Tell me how you feel from one to ten";
                return this.emit(':elicitSlot', 'feelingRating', prompt, reprompt); 
            }
            
            else if(this.event.request.intent.slots.feelingRating.confirmationStatus !== 'CONFIRMED' && this.event.request.intent.slots.feelingRating.value !== 'skip'){
                if(this.event.request.intent.slots.feelingRating.confirmationStatus !== 'DENIED'){
                    let prompt = "Are you sure " + this.event.request.intent.slots.feelingRating.value + " is your rating";
                    let reprompt = "You feeling score is " + this.event.request.intent.slots.feelingRating.value +" right";
                    return this.emit(':confirmSlot', 'feelingRating', prompt, reprompt);    
                }
                //Denied
                else{
                    let prompt = "From one to ten how do you feel. Test one";
                    let reprompt = "Tell me how you feel from one to ten";
                    return this.emit(':elicitSlot', 'feelingRating', prompt, reprompt); 
                }
            }
            
            //Sleeping
            if (!this.event.request.intent.slots.sleepingRating.value) {
                let prompt = "From one to ten, are you sleepy";
                let reprompt = "Tell me your sleeping from one to ten";
                return this.emit(':elicitSlot', 'sleepingRating', prompt, reprompt);
            } 
            else if (this.event.request.intent.slots.sleepingRating.resolutions.resolutionsPerAuthority[0].status.code == 'ER_SUCCESS_NO_MATCH') {             
                let prompt = "Sorry I didn't hear rating for your sleeping or you didnt't give me a number from one to ten";
                let reprompt = "Tell me how sleepy you are from one to ten";
                return this.emit(':elicitSlot', 'sleepingRating', prompt, reprompt); 
            }
            
            else if(this.event.request.intent.slots.sleepingRating.confirmationStatus !== 'CONFIRMED' && this.event.request.intent.slots.sleepingRating.value !== 'skip'){
                if(this.event.request.intent.slots.sleepingRating.confirmationStatus !== 'DENIED'){
                    let prompt = "Are you sure your sleep is " + this.event.request.intent.slots.sleepingRating.value;
                    let reprompt = "You sleeping score is " + this.event.request.intent.slots.sleepingRating.value +" right";
                    return this.emit(':confirmSlot', 'sleepingRating', prompt, reprompt);    
                }
                //Denied
                else{
                    let prompt = "From one to ten how is your sleep. TEST two";
                    let reprompt = "Tell me how you feel from one to ten";
                    return this.emit(':elicitSlot', 'sleepingRating', prompt, reprompt); 
                }
            }        
            
            

            //Breathing
            if (!this.event.request.intent.slots.breathingRating.value) {
                let prompt = "From one to ten how is your breathing";
                let reprompt = "Tell me how about your breathing from one to ten";
                return this.emit(':elicitSlot', 'breathingRating', prompt, reprompt); 
            } 
            else if (this.event.request.intent.slots.breathingRating.resolutions.resolutionsPerAuthority[0].status.code == 'ER_SUCCESS_NO_MATCH') {             
                let prompt = "Sorry I didn't hear rating for breathing or you didnt't give me a number from one to ten";
                let reprompt = "Tell me how's your breathing from one to ten";
                return this.emit(':elicitSlot', 'breathingRating', prompt, reprompt); 
            }
            
            else if(this.event.request.intent.slots.breathingRating.confirmationStatus !== 'CONFIRMED' && this.event.request.intent.slots.breathingRating.value !== 'skip'){
                if(this.event.request.intent.slots.breathingRating.confirmationStatus !== 'DENIED'){
                    let prompt = "Are you sure " + this.event.request.intent.slots.breathingRating.value + " for your breathing";
                    let reprompt = "You breathing score is " + this.event.request.intent.slots.breathingRating.value +" correct?";
                    return this.emit(':confirmSlot', 'breathingRating', prompt, reprompt);    
                }
                //Denied
                else{
                    let prompt = "From one to ten how is your breathing test 3";
                    let reprompt = "Tell me about your breathing from one to ten";
                    return this.emit(':elicitSlot', 'breathingRating', prompt, reprompt); 
                }
            }
            

            //Swollen
            if (!this.event.request.intent.slots.SwollenRating.value) {
                let prompt = "From one to ten is your feet swollen";
                let reprompt = "Tell me about your feet from one to ten";
                return this.emit(':elicitSlot', 'SwollenRating', prompt, reprompt); 
            }  
            else if (this.event.request.intent.slots.SwollenRating.resolutions.resolutionsPerAuthority[0].status.code == 'ER_SUCCESS_NO_MATCH') {             
                let prompt = "Sorry I didn't hear rating for swollen feet or you didnt't give me a number from one to ten";
                let reprompt = "Tell me if your feet are swollen from one to ten";
                return this.emit(':elicitSlot', 'SwollenRating', prompt, reprompt); 
            }
            
            else if(this.event.request.intent.slots.SwollenRating.confirmationStatus !== 'CONFIRMED' && this.event.request.intent.slots.SwollenRating.value !== 'skip'){
                if(this.event.request.intent.slots.SwollenRating.confirmationStatus !== 'DENIED'){
                    let prompt = "Swollen rating is " + this.event.request.intent.slots.SwollenRating.value + " right?";
                    let reprompt = "You swollen feet score is " + this.event.request.intent.slots.SwollenRating.value +" correct?";
                    return this.emit(':confirmSlot', 'SwollenRating', prompt, reprompt);    
                }
                //Denied
                else{
                    let prompt = "From one to ten, are your feet swollen test 4";
                    let reprompt = "Tell me if your feet are swollen from one to ten";
                    return this.emit(':elicitSlot', 'SwollenRating', prompt, reprompt); 
                }
            } 
            
            //If stop in any point return to launch
            if (this.event.request.intent.slots.sleepingRating.value == 'stop' || this.event.request.intent.slots.feelingRating.value == 'stop' || this.event.request.intent.slots.breathingRating.value == 'stop' || this.event.request.intent.slots.SwollenRating.value == 'stop') {             
  
            const feelingScore = this.event.request.intent.slots.feelingRating.value;
            const sleepingScore = this.event.request.intent.slots.sleepingRating.value;
            const breathingScore = this.event.request.intent.slots.breathingRating.value;
            const swollenScore = this.event.request.intent.slots.SwollenRating.value;
            const id = this.event.request.intent.slots.id.value;

            
            this.attributes.healthscores.patientID = id;
            this.attributes.healthscores.scores['feeling'].score = feelingScore;
            this.attributes.healthscores.scores['sleeping'].score = sleepingScore;
            this.attributes.healthscores.scores['breathing'].score = breathingScore;
            this.attributes.healthscores.scores['swollen'].score = swollenScore;

            request.get(url(id, feelingScore, sleepingScore, breathingScore, swollenScore), function(err, res, body) {  
                 console.log(body);
             });

            
			this.emitWithState('LaunchRequest');
			
            					
            }              
            //Error Check
            // if (this.event.request.intent.slots.id.value == '?') {
            //     let prompt = "Sorry I didn't hear your ID number";
            //     let reprompt = "Can you give me your ID number";
            //     return this.emit(':elicitSlot', 'id', prompt, reprompt); 
            // }
            //Feeling

            //Sleeping

            //Breathing

            //Swollen
         
            
            //Confirm
            
            
            else{
                this.emit(':delegate');
            }            
            
        }
        else{
			
			const accessToken = this.event.context.System.user.accessToken;
			
			fScore = this.event.request.intent.slots.feelingRating.value;
			sScore = this.event.request.intent.slots.SwollenRating.value;
			
            const feelingScore = this.event.request.intent.slots.feelingRating.value;
            const sleepingScore = this.event.request.intent.slots.sleepingRating.value;
            const breathingScore = this.event.request.intent.slots.breathingRating.value;
            const swollenScore = this.event.request.intent.slots.SwollenRating.value;
            //const id = this.event.request.intent.slots.id.value;
			const id = uId;

						
            //global
			globFeel = feelingScore;
			globBreath = breathingScore;
			globSleep = sleepingScore;
			globSwol = swollenScore;
			
            this.attributes.healthscores.patientID = id;
            this.attributes.healthscores.scores['feeling'].score = feelingScore;
            this.attributes.healthscores.scores['sleeping'].score = sleepingScore;
            this.attributes.healthscores.scores['breathing'].score = breathingScore;
            this.attributes.healthscores.scores['swollen'].score = swollenScore;

            request.get(url(id, feelingScore, sleepingScore, breathingScore, swollenScore), function(err, res, body) {  
                 console.log(body);
             });

            this.response.speak("Health Scores Recorded");
            //this.emit(':responseReady');
			this.emitWithState('LaunchRequest');
        }


    },
    'FeelingQuestions': function() {
        var id_attr = this.attributes.healthscores.patientID;
        var feeling_attr = this.attributes.healthscores.scores['feeling'].score;
        var sleeping_attr = this.attributes.healthscores.scores['sleeping'].score;
        var breathing_attr = this.attributes.healthscores.scores['breathing'].score;
        var swollen_attr = this.attributes.healthscores.scores['swollen'].score;

        if(this.event.request.dialogState !== 'COMPLETED'){
            if (this.event.request.intent.slots.feelingRating.value == '?' || this.event.request.intent.slots.feelingRating.value < 1 || this.event.request.intent.slots.feelingRating.value > 10) { 
                let prompt = "Sorry I didn't hear rating for how you feel or you didnt't give me a number from one to ten";
                let reprompt = "Tell me how you feel from one to ten";
                this.emit(':elicitSlot', 'feelingRating', prompt, reprompt); 
            } 
            else{
                this.emit(':delegate');
            }
        }
        else{
            const feelingScore = this.event.request.intent.slots.feelingRating.value;
            this.attributes.healthscores.scores['feeling'].score = feelingScore;
            feeling_attr = this.attributes.healthscores.scores['feeling'].score;


            // request.get(url(id_attr, feeling_attr, sleeping_attr, breathing_attr, swollen_attr), function(err, res, body) {  
            //     console.log(body);
            // });
            this.response.speak("Feeling score successfully updated");
            this.emit(':responseReady');
        }

    },
    'SleepingQuestions': function() {
        var id_attr = this.attributes.healthscores.patientID;
        var feeling_attr = this.attributes.healthscores.scores['feeling'].score;
        var sleeping_attr = this.attributes.healthscores.scores['sleeping'].score;
        var breathing_attr = this.attributes.healthscores.scores['breathing'].score;
        var swollen_attr = this.attributes.healthscores.scores['swollen'].score;

        if(this.event.request.dialogState !== 'COMPLETED'){
            if (this.event.request.intent.slots.sleepingRating.value == '?' || this.event.request.intent.slots.sleepingRating.value < 1 || this.event.request.intent.slots.sleepingRating.value > 10) {
                let prompt = "Sorry I didn't hear your rating for your sleeping score or you didnt't give me a number from one to ten";
                let reprompt = "Tell me how you feel from one to ten";
                this.emit(':elicitSlot', 'sleepingRating', prompt, reprompt);
            } 
            else{
                this.emit(':delegate');
            }
        }
        else{
            const sleepingScore = this.event.request.intent.slots.sleepingRating.value;
            this.attributes.healthscores.scores['sleeping'].score = sleepingScore;
            sleeping_attr = this.attributes.healthscores.scores['sleeping'].score;
            // request.get(url(id_attr, feeling_attr, sleeping_attr, breathing_attr, swollen_attr), function(err, res, body) {  
            //     console.log(body);
            // });

            this.response.speak("Sleeping score successfully updated");
            this.emit(':responseReady');
        }
    },
    'BreathingQuestions': function() {
        var id_attr = this.attributes.healthscores.patientID;
        var feeling_attr = this.attributes.healthscores.scores['feeling'].score;
        var sleeping_attr = this.attributes.healthscores.scores['sleeping'].score;
        var breathing_attr = this.attributes.healthscores.scores['breathing'].score;
        var swollen_attr = this.attributes.healthscores.scores['swollen'].score;

        if(this.event.request.dialogState !== 'COMPLETED'){
            if (this.event.request.intent.slots.breathingRating.value == '?' || this.event.request.intent.slots.breathingRating.value < 1 || this.event.request.intent.slots.breathingRating.value > 10) {
                let prompt = "Sorry I didn't hear your breathing rating or you didnt't give me a number from one to ten";
                let reprompt = "Tell me how you feel from one to ten";
                this.emit(':elicitSlot', 'breathingRating', prompt, reprompt); 
            } 
            else{
                this.emit(':delegate');
            }
        }
        else{
            const breathingScore = this.event.request.intent.slots.breathingRating.value;
            this.attributes.healthscores.scores['breathing'].score = breathingScore;
            breathing_attr = this.attributes.healthscores.scores['breathing'].score;
            // request.get(url(id_attr, feeling_attr, sleeping_attr, breathing_attr, swollen_attr), function(err, res, body) {  
            //     console.log(body);
            // });


            this.response.speak("Breathing score successfully updated");
            this.emit(':responseReady');
        }
    },
    'SwollenQuestions': function() {
        var id_attr = this.attributes.healthscores.patientID;
        var feeling_attr = this.attributes.healthscores.scores['feeling'].score;
        var sleeping_attr = this.attributes.healthscores.scores['sleeping'].score;
        var breathing_attr = this.attributes.healthscores.scores['breathing'].score;
        var swollen_attr = this.attributes.healthscores.scores['swollen'].score;

        if(this.event.request.dialogState !== 'COMPLETED'){
            if (this.event.request.intent.slots.SwollenRating.value == '?' || this.event.request.intent.slots.SwollenRating.value < 1 || this.event.request.intent.slots.SwollenRating.value > 10) {
                let prompt = "Sorry I didn't hear rating for your swollen rating or you didnt't give me a number from one to ten";
                let reprompt = "Tell me how you feel from one to ten";
                this.emit(':elicitSlot', 'SwollenRating', prompt, reprompt); 
            }
            else{
                this.emit(':delegate');
            }
        }
        else{
            const swollenScore = this.event.request.intent.slots.SwollenRating.value;
            this.attributes.healthscores.scores['swollen'].score = swollenScore;
            swollen_attr = this.attributes.healthscores.scores['swollen'].score;

            // request.get(url(id_attr, feeling_attr, sleeping_attr, breathing_attr, swollen_attr), function(err, res, body) {  
            //     console.log(body);
            // });
            
            this.response.speak("Swollen score successfully updated");
            this.emit(':responseReady');
        }
    },
	
    'Schedule': function () {
			if (!this.event.request.intent.slots.req.value) { 
				let prompt = "Would you like to schedule a meal, appointment, or ride.";
                let reprompt = "What do you want to schedule for.";
                return this.emit(':elicitSlot', 'req', prompt, reprompt); 
            }
            else if (this.event.request.intent.slots.req.resolutions.resolutionsPerAuthority[0].status.code == 'ER_SUCCESS_NO_MATCH') {             
                let prompt = "Sorry I coudn't hear your request, schedule for a meal, appointmentm or ride.";
                let reprompt = "Do you want to schedule for a ride, meal, or appointment";
                return this.emit(':elicitSlot', 'req', prompt, reprompt); 
            }
			if (this.event.request.intent.slots.req.value == 'meal') { 
				 this.emitWithState('Meals');
            }
			if (this.event.request.intent.slots.req.value == 'ride') { 
				 this.emitWithState('Ride');
            }
			if (this.event.request.intent.slots.req.value == 'appointment') { 
				 this.emitWithState('Appointment');
            }
    },
    'Meals': function () {

        this.attributes.meals = {
            'food' : this.event.request.intent.slots.Food.value,
            'date': this.event.request.intent.slots.date.value,
			'time': this.event.request.intent.slots.time.value,

        };

		if(this.event.request.dialogState !== 'COMPLETED'){	
			        
///////////////////////
            //Food
            if (!this.event.request.intent.slots.Food.value) { 	
                let prompt = "Do you want fish, meat, chicken, or a salad";
                let reprompt = "We have fish, meat, chicken, or a salad";
                return this.emit(':elicitSlot', 'Food', prompt, reprompt); 
            }
            else if (this.event.request.intent.slots.Food.resolutions.resolutionsPerAuthority[0].status.code == 'ER_SUCCESS_NO_MATCH') {             
                let prompt = "Sorry we don't have that on the menu, do you want fish, meat, chicken, or salad";
                let reprompt = "We have fish, meat, chicken, or a salad";
                return this.emit(':elicitSlot', 'Food', prompt, reprompt); 
            }
            
            else if(this.event.request.intent.slots.Food.confirmationStatus !== 'CONFIRMED'){
                if(this.event.request.intent.slots.Food.confirmationStatus !== 'DENIED'){
                    let prompt = "Are you sure " + this.event.request.intent.slots.Food.value + " is your choice";
                    let reprompt = "You wanted " + this.event.request.intent.slots.Food.value + ", right";
                    return this.emit(':confirmSlot', 'Food', prompt, reprompt);    
                }
                //Denied
                else{
                    let prompt = "Do you want fish, meat, chicken, or a salad";
                    let reprompt = "We have fish, meat, chicken, or a salad";
                    return this.emit(':elicitSlot', 'Food', prompt, reprompt); 
                }
            }

            //Date
            if (!this.event.request.intent.slots.date.value) { 	
                let prompt = "What day you want your meal on.";
                let reprompt = "On what day you want your meal booked.";
                return this.emit(':elicitSlot', 'date', prompt, reprompt); 
            }
            else if (this.event.request.intent.slots.date.value == '?') {             
                let prompt = "Sorry can you repeat the date";
                let reprompt = "On what day you want your meal booked.";
                return this.emit(':elicitSlot', 'date', prompt, reprompt); 
            }
            
            else if(this.event.request.intent.slots.date.confirmationStatus !== 'CONFIRMED'){
                if(this.event.request.intent.slots.date.confirmationStatus !== 'DENIED'){
                    let prompt = "Are you sure " + this.event.request.intent.slots.date.value + " the right date.";
                    let reprompt = "You wanted " + this.event.request.intent.slots.date.value + " for the day for your meal to be booked";
                    return this.emit(':confirmSlot', 'date', prompt, reprompt);    
                }
                //Denied
                else{
                    let prompt = "What day you want your meal on.";
                    let reprompt = "What day you want your meal on.";
                    return this.emit(':elicitSlot', 'date', prompt, reprompt); 
                }
            }

            //Time
            if (!this.event.request.intent.slots.time.value) { 	
                let prompt = "What time do you want your meal.";
                let reprompt = "What time do you want your meal.";
                return this.emit(':elicitSlot', 'time', prompt, reprompt); 
            }
            else if (this.event.request.intent.slots.time.value == '?') {             
                let prompt = "Sorry can you repeat the time";
                let reprompt = "What time you want your meal booked.";
                return this.emit(':elicitSlot', 'time', prompt, reprompt); 
            }
            
            else if(this.event.request.intent.slots.time.confirmationStatus !== 'CONFIRMED'){
                if(this.event.request.intent.slots.time.confirmationStatus !== 'DENIED'){
                    let prompt = "Are you sure " + this.event.request.intent.slots.time.value + " for the right time.";
                    let reprompt = "You wanted " + this.event.request.intent.slots.time.value + " for the time for your meal to be booked";
                    return this.emit(':confirmSlot', 'time', prompt, reprompt);    
                }
                //Denied
                else{
                    let prompt = "What time you want your meal on.";
                    let reprompt = "What time you want your meal on.";
                    return this.emit(':elicitSlot', 'time', prompt, reprompt); 
                }
            }
			
            else{
                this.emit(':delegate');
            }            
            
        }
        else{
						
            const userFood = this.event.request.intent.slots.Food.value;
            const userDate = this.event.request.intent.slots.date.value;
            const userTime = this.event.request.intent.slots.time.value;
			
			globFood = userFood;
			globDate = userDate;
			globTime = userTime;
            
            this.attributes.meals.food = userFood;
			this.attributes.meals.date = userDate;
			this.attributes.meals.time = userTime;

            this.response.speak("Meal booked.");
			//this.emitWithState('LaunchRequest');
			this.emitWithState('HelloWorldIntentHandler');
		}
    },
    'Ride': function () {
        this.emit(':ask', 'Welcome to Ride', 'Try calling for help to know your commands');
    },
    'Appointment': function () {
        this.emit(':ask', 'Welcome to Appointment', 'Try calling for help to know your commands');
    },
	
    'AMAZON.HelpIntent': function () {
        const speechOutput = HELP_MESSAGE;
        const reprompt = HELP_REPROMPT;

        this.response.speak(speechOutput).listen(reprompt);
        this.emit(':responseReady');
    },
    'AMAZON.CancelIntent': function () {
        this.response.speak(STOP_MESSAGE);
        this.emit(':responseReady');
    },
    'AMAZON.StopIntent': function () {
        this.response.speak(STOP_MESSAGE);
        this.emit(':responseReady');
    },
    'SessionEndedRequest': function(){
        this.emit('saveState', true);
    }
};



// V2 Handler Intents
const HelloWorldIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
          && handlerInput.requestEnvelope.request.intent.name === 'HelloWorldIntent';
      },
      handle(handlerInput) {
        // return new Promise((resolve, reject) => {
        //   handlerInput.attributesManager.getPersistentAttributes()
        //     .then((attributes) => {
        //       const speechText = 'The robot is in the initial position.';
    
        //       attributes.position = {
        //         'id': 'northas',
        //         'day': 'Friday',
        //         'time': '7:00 AM'
        //       };
    
        //       handlerInput.attributesManager.setPersistentAttributes(attributes);
        //       handlerInput.attributesManager.savePersistentAttributes();
    
        //       resolve(handlerInput.responseBuilder
        //         .speak(speechText)
        //         .reprompt(speechText)
        //         .withSimpleCard(CARD_TITLE, speechText)
        //         .getResponse());
        //     })
        //     .catch((error) => {
        //       reject(error);
        //     });
        // });

        this.attributes.healthscores = {
            'patientID' : 0,
            'scores': {
                'feeling': {
                    'score': 0
                },
                'sleeping': {
                    'score': 0
                },
                'breathing': {
                    'score': 0
                },
                'swollen': {
                    'score': 0
                }
            },

        };


        const feelingScore = 'e';
        const sleepingScore = 'd';
        const breathingScore = 'c';
        const swollenScore = 'b';
        const id = 'a';

        
        this.attributes.healthscores.patientID = id;
        this.attributes.healthscores.scores['feeling'].score = feelingScore;
        this.attributes.healthscores.scores['sleeping'].score = sleepingScore;
        this.attributes.healthscores.scores['breathing'].score = breathingScore;
        this.attributes.healthscores.scores['swollen'].score = swollenScore;

      },
};

const CreateReminderHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest' && request.intent.name === 'CreateReminderIntent';
  },
  async handle(handlerInput) {
    const requestEnvelope = handlerInput.requestEnvelope;
    const responseBuilder = handlerInput.responseBuilder;
    const consentToken = requestEnvelope.context.System.apiAccessToken;

    // check for confirmation.  if not confirmed, delegate
    switch (requestEnvelope.request.intent.confirmationStatus) {
      case 'CONFIRMED':
        // intent is confirmed, so continue
        console.log('Alexa confirmed intent, so clear to create reminder');
        break;
      case 'DENIED':
        // intent was explicitly not confirmed, so skip creating the reminder
        console.log('Alexa disconfirmed the intent; not creating reminder');
        return responseBuilder
          .speak(`${messages.NO_REMINDER} ${messages.WHAT_DO_YOU_WANT}`)
          .reprompt(messages.WHAT_DO_YOU_WANT)
          .getResponse();
      case 'NONE':
      default:
        console.log('delegate back to Alexa to get confirmation');
        return responseBuilder
          .addDelegateDirective()
          .getResponse();
    }

    if (!consentToken) {
      return responseBuilder
        .speak(messages.NOTIFY_MISSING_PERMISSIONS)
        .withAskForPermissionsConsentCard(PERMISSIONS)
        .getResponse();
    }
    try {
      const client = handlerInput.serviceClientFactory.getReminderManagementServiceClient();
      const date = handlerInput.requestEnvelope.request.intent.slots.date.value;
      const time = handlerInput.requestEnvelope.request.intent.slots.time.value;
      
      let stringSplit = date.split("-");
      stringSplit[2] = String(parseInt(stringSplit[2]) - 1);
      const newDate = stringSplit.join("-");

      const reminderRequest = {
        trigger: {
          type: 'SCHEDULED_ABSOLUTE',
          scheduledTime: `${newDate}T${time}`,
        },
        alertInfo: {
          spokenInfo: {
            content: [{
              locale: 'en-US',
              text: 'make a appointment',
            }],
          },
        },
        pushNotification: {
          status: 'ENABLED',
        },
      };
      const reminderResponse = await client.createReminder(reminderRequest);
      console.log(JSON.stringify(reminderResponse));

				globFood = JSON.stringify(reminderResponse.createdTime);    
    } catch (error) {
      if (error.name !== 'ServiceError') {
        console.log(`error: ${error.stack}`);
        const response = responseBuilder.speak(messages.ERROR).getResponse();
        return response;
      }
      throw error;
    }
    
    const reminderSpeak = `OK, reminder created` + globFood;
    return responseBuilder
      .speak(reminderSpeak)
      .getResponse();
  },
};


/*
exports.handler = function (event, context, callback) {
    const alexa = Alexa.handler(event, context, callback);
    alexa.dynamoDBTableName = 'HealthScores';
	alexa.dynamoDBTableName = 'Meals';
    alexa.APP_ID = APP_ID;
    alexa.registerHandlers(handlers);
    alexa.execute();
};
*/

