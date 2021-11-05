const { google } = require("googleapis");
const axios = require("axios");
require("dotenv").config();

const CI = process.env.client_id;
const CS = process.env.client_secret;
const RI = "http://localhost:8000/auth/google/secrets";
const RT =
  "";

const getRefreshToken = (CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN, callback) => {
  url =
    "https://oauth2.googleapis.com/token?grant_type=refresh_token&refresh_token=" +
    REFRESH_TOKEN +
    "&client_id=" +
    CLIENT_ID +
    "&client_secret=" +
    CLIENT_SECRET;

  axios
    .post(url, {})
    .then(function (response) {
      callback(response.data);
    })
    .catch(function (error) {
      callback(error);
    });
};

function createSpreadsheet(Name, callback) {
  const oAuth2Client = new google.auth.OAuth2(CI, CS, RI);

  getRefreshToken(CI, CS, RT, (accessToken) => {
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

function readColumn(spreadsheetID, myRange, callback) {
  const oAuth2Client = new google.auth.OAuth2(CI, CS, RI);

  getRefreshToken(CI, CS, RT, (accessToken) => {
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


readColumn(spreadsheetID, myRange, callback)


// createSpreadsheet("1234monkey", function (response) {
//   //   console.log(response);
// });

// getRefreshToken(CI, CS, RT, (at) => {
//   console.log(at);
// });

module.exports = {
  getRefreshToken,
  createSpreadsheet,
};
