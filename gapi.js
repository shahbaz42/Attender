const { google } = require("googleapis");
const axios = require("axios");
require("dotenv").config();



const getAccessToken = (refresh_token, callback) => {
  url =
    "https://oauth2.googleapis.com/token?grant_type=refresh_token&refresh_token=" +
    refresh_token +
    "&client_id=" +
    process.env.client_id +
    "&client_secret=" +
    process.env.client_secret;

  axios
    .post(url, {})
    .then(function (response) {
      callback(response.data);
    })
    .catch(function (error) {
      callback(error);
    });
};



const createSpreadsheet = (refresh_token, Name, callback)=> {
  
    const oAuth2Client = new google.auth.OAuth2(process.env.client_id, process.env.client_secret, refresh_token);

  getAccessToken(refresh_token, (accessToken) => {
    oAuth2Client.setCredentials({ access_token: accessToken.access_token });
    const sheets = google.sheets("v4");
    const request = {
      resource: {
        properties: {
          title: Name,
        },
      },
      auth: oAuth2Client,
    };

    sheets.spreadsheets.create(request, function (err, response) {
      if (err) {
        console.log(err);
      } else {
        callback(response);
      }
    });
  });

}



const readColumn = (refresh_token, spreadsheetID, myRange, callback)=> {

  const oAuth2Client = new google.auth.OAuth2(process.env.client_id, process.env.client_secret, refresh_token);

  getAccessToken(refresh_token, (accessToken) => {
    oAuth2Client.setCredentials({ access_token: accessToken.access_token });

    const sheets = google.sheets("v4");
    const request = {
      auth: oAuth2Client,
      spreadsheetId: spreadsheetID,
      range: myRange,
    };

    sheets.spreadsheets.values.get(request, function (err, response) {
      if (err) {
        console.log(err);
      } else {
        callback(response);
      }
    });
  });

}


const appendColumn = (refresh_token, spreadsheetID, callback)=> {}


/*
readColumn(refresh_token , SSID, "Sheet1!A1:A", function (response) {
   console.log(response);
});

createSpreadsheet(refresh_token, "1234monkey", function (response) {
  //   console.log(response);
});

getRefreshToken(CI, CS, RT, (at) => {
  console.log(at);
});
*/

module.exports = {
  getAccessToken,
  createSpreadsheet,
  readColumn,
  appendColumn
};
