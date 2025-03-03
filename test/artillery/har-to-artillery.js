const fs = require('fs');
const yaml = require('js-yaml');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();
// Load the HAR file
const harFile = process.env.HAR_FILE_PATH;
const harData = JSON.parse(fs.readFileSync(harFile, 'utf8'));
let totalStatements=0;
transformTraces = function(json) {
  totalStatements+=json.length;
  let jsonTransformed=[];
  for(let i=0; i<json.length;i++) {
    let trace=json[i];
    if(trace.actor) {
      if(trace.actor.name) {
        trace.actor.name="<<username>>";
      }
      if(trace.actor.account) {
        if(trace.actor.account.name) {
          trace.actor.account.name="<<username>>";
        }
        if(trace.actor.account.homePage) {
          trace.actor.account.homePage=`${process.env.HOME_URL}`;
        }
      }
      jsonTransformed.push(trace);
    }
    if(trace.id) {
      delete trace.id; // = uuidv4();
    }
  }
  return JSON.stringify(jsonTransformed);
};

// Create an Artillery configuration
const artilleryConfig = {
  config: {
    target: `${process.env.API_URL}`, // Replace with your target
    phases: [
      {
        duration: `${process.env.DURATION_MIN}min`, // Run the simulation for x minutes
        arrivalRate: process.env.ARRIVAL_RATE*1, // x new virtual users per second
        maxVusers: process.env.MAX_VUSER*1, // no more than x concurrent virtual users at any given time
      }
    ],
    http: {
      //# Responses have to be sent within 10 seconds, or an `ETIMEDOUT` error gets raised.
      timeout: process.env.TIMEOUT*1,
    },
    //defaults: {
    //  flow: {
    //    think: process.env.DEFAULT_THINK_SEC*1, // Add a default 1-second pause after each step
    //  }
    //},
    payload: {
      path: "./users.csv",
      fields: [ "username" ]
    },
    processor: "./functions.js"
  },
  scenarios: [
    {
      name: "Fetch Auth Token and send traces",
      flow: [
        {
          post: {
            url: `${process.env.SSO_URL}/realms/${process.env.SSO_REALM}/protocol/openid-connect/token`,
            form: {
              grant_type: "password",
              client_id: `${process.env.CLIENT_ID}`,
              username: "{{ username }}",
              password: "{{ username }}",
              login_hint: `${process.env.STUDY_ID}`,
              scope: "offline_access"
            },
            capture: {
              json: "access_token",
              as: "token",
            },
          }
        },
        {
          function: "getToken",
        }
      ],
    }
  ],
};

harStatements=harData.log.entries
        .filter(entry => entry.request.method === "POST" && entry.request.url.endsWith("/statements")) // Filter POST requests
        .map(entry => ({ 
          request: {
            post: {
              url: `/activities/${process.env.ACTIVITY_ID}/statements`,
              body: entry.request.postData ? transformTraces(JSON.parse(entry.request.postData.text)) : {},
              headers: {
                  Authorization: "Bearer {{ token }}",
                  "Content-Type": "application/json",
              }
            }
          },
          dateTime: entry.startedDateTime,
          time: entry.time,
        }));
 
console.log(`${harStatements.length} statements`);
let totaltime=0;
let time=new Date(harStatements[0].dateTime);
let steps=[];
harStatements.forEach(element => {
  let tmp=new Date(element.dateTime);
  let thinkTime=(tmp-time)/1000;
  console.log(`${time} - ${tmp} : ${thinkTime} sec`);
  time=tmp;
  totaltime+=thinkTime;
  //steps.push({think : Math.min(Math.max(process.env.DEFAULT_THINK_SEC*1, Math.floor(thinkTime)), process.env.MAX_THINK_SEC*1) });
  //steps.push(element.request);
  artilleryConfig.scenarios[0].flow.push({think : Math.min(Math.max(process.env.DEFAULT_THINK_SEC*1, Math.floor(thinkTime)), process.env.MAX_THINK_SEC*1)  });
  artilleryConfig.scenarios[0].flow.push(element.request);
});
/*
let loop={
  loop: steps,
  count:1,
}
artilleryConfig.scenarios[0].flow.push(loop);
*/
console.log(`${harStatements.length} requests / ${totalStatements} statements - ${harStatements[0].dateTime} - ${harStatements[harStatements.length-1].dateTime} time : ${totaltime} seconds`);

// Function to clean up nested quotes
function removeNestedQuotes(obj) {
  const cleanedObject = JSON.parse(JSON.stringify(obj)); // Deep clone to avoid mutation

  const processValue = (value) => {
    if (typeof value === "string" && /^'.*'$/.test(value)) {
      return value.slice(1, -1); // Remove the outer single quotes
    }
    return value;
  };

  const processObject = (obj) => {
    for (const key in obj) {
      if (typeof obj[key] === "object" && obj[key] !== null) {
        processObject(obj[key]); // Recursively process nested objects
      } else {
        obj[key] = processValue(obj[key]);
      }
    }
  };

  processObject(cleanedObject);
  return cleanedObject;
}

// Preprocess the object
const cleanedObject = removeNestedQuotes(artilleryConfig);

// Convert Artillery config to YAML
const yamlData = yaml.dump(cleanedObject, { 
  noRefs: true,
  styles: { '!!str': 'double-quoted' },
  lineWidth: -1, 
}).replaceAll("<<username>>", "{{ username }}");

// Write YAML to a file
fs.writeFileSync(`${harFile.replace(".har","")}-har-artillery-config.yml`, yamlData, 'utf8');

console.log('Artillery configuration has been created.');