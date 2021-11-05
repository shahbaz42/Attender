const { google } = require("googleapis");
const axios = require("axios");
require("dotenv").config();


const getAccessToken = (token, callback) => {
  url =
    "https://oauth2.googleapis.com/token?grant_type=refresh_token&refresh_token=" +
    token.refresh_token +
    "&client_id=" +
    token.client_id +
    "&client_secret=" +
    token.client_secret;

  axios
    .post(url, {})
    .then(function (response) {
      callback(response.data);
    })
    .catch(function (error) {
      callback(error);
    });
};



const createSpreadsheet (token, Name, callback)=> {
  const oAuth2Client = new google.auth.OAuth2(token.client_id, token.client_secret, token.refresh_token);

  getAccessToken(token, (accessToken) => {
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

const readColumn(token, spreadsheetID, myRange, callback)=> {
  const oAuth2Client = new google.auth.OAuth2(token.client_id, token.client_secret, token.refresh_token);

  getAccessToken(token, (accessToken) => {
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

// readColumn(tokenSamp , SSID, "Sheet1!A1:A", function (response) {
//   console.log(response);
// });

// createSpreadsheet(tokenSamp, "1234monkey", function (response) {
//   //   console.log(response);
// });

// getRefreshToken(CI, CS, RT, (at) => {
//   console.log(at);
// });

module.exports = {
  getAccessToken,
  createSpreadsheet,
  readColumn,
};
