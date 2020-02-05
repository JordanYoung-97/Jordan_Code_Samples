const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv').config();
const app = express();
const crypto = require('crypto');
const cookie = require('cookie');
const nonce = require('nonce')();
const querystring = require('querystring');
const request = require('request-promise');


const apiKey = process.env.SHOPIFY_API_KEY;
const apiSecret = process.env.SHOPIFY_API_SECRET;
const scopes = 'read_products, read_customers, write_customers';
const forwardingAddress = "https://6e9ed9e6.ngrok.io"; // Replace this with your HTTPS Forwarding address

var customerCount = {};

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(3000, () => {
  console.log('Example app listening on port 3000!');
});

app.get('/shopify', (req, res) => {
    const shop = req.query.shop;
    if (shop) {
      const state = nonce();
      const redirectUri = forwardingAddress + '/shopify/callback';
      const installUrl = 'https://' + shop +
        '/admin/oauth/authorize?client_id=' + apiKey +
        '&scope=' + scopes +
        '&state=' + state +
        '&redirect_uri=' + redirectUri;
  
      res.cookie('state', state);
      res.redirect(installUrl);
    } else {
      return res.status(400).send('Missing shop parameter. Please add ?shop=your-development-shop.myshopify.com to your request');
    }
  });

  app.get('/shopify/callback', (req, res) => {
  const { shop, hmac, code, state } = req.query;
  const stateCookie = cookie.parse(req.headers.cookie).state;

  if (state !== stateCookie) {
    return res.status(403).send('Request origin cannot be verified');
  }

  if (shop && hmac && code) {
    // DONE: Validate request is from Shopify
    const map = Object.assign({}, req.query);
    delete map['signature'];
    delete map['hmac'];
    const message = querystring.stringify(map);
    const providedHmac = Buffer.from(hmac, 'utf-8');
    const generatedHash = Buffer.from(
      crypto
        .createHmac('sha256', apiSecret)
        .update(message)
        .digest('hex'),
        'utf-8'
      );
    let hashEquals = false;

    try {
      hashEquals = crypto.timingSafeEqual(generatedHash, providedHmac)
    } catch (e) {
      hashEquals = false;
    };

    if (!hashEquals) {
      return res.status(400).send('HMAC validation failed');
    }

    // DONE: Exchange temporary code for a permanent access token
    const accessTokenRequestUrl = 'https://' + shop + '/admin/oauth/access_token';
    const accessTokenPayload = {
      client_id: apiKey,
      client_secret: apiSecret,
      code,
    };

    request.post(accessTokenRequestUrl, { json: accessTokenPayload })
    .then((accessTokenResponse) => {
      const accessToken = accessTokenResponse.access_token;
      // DONE: Use access token to make API call to 'count' endpoint
      const shopRequestUrl = 'https://' + shop + '/admin/api/2019-07/customers/count.json';
      const shopRequestHeaders = {
        'X-Shopify-Access-Token': accessToken,
      };

      // GET REQUEST FOR CUSTOMERS AND CUSTOMER INFO
      request.get(shopRequestUrl, { headers: shopRequestHeaders })
      .then((shopResponse) => {
          let customers = JSON.parse(shopResponse);
          customerCount = customers.count;
          var limit = 250; //limit of customers per page
          if(customerCount > 0){
            var pages = Math.ceil(customerCount / limit);
            console.log('pages: ' + pages);
            for (let i = 0; i < pages; i++) {
                request.get('https://' + shop + '/admin/api/2019-07/customers.json?limit=' + limit + '&page='+(i + 1), {headers: shopRequestHeaders})
                .then((customers) => {
                    var customerList = JSON.parse(customers);
                    var x = 0;

                    //Cant feed all the customers through the api at once. Encase PUT call in a function, then delay the call of the functions using setTimeout()
                    function go() {
                        const element = customerList.customers[x];
                        var tagToAdd = '';
                        //first check if customer is already a wholesale customer, if so add the whexclude tag which will exclude them from the Auto Tagging feature a part of Wholesale Hero.
                        if(element.tags.includes('Wholesaler')){
                            tagToAdd = ',whexclude';
                        } else {
                            if(element.total_spent >= 300){
                                if(element.default_address.country == 'United States'){
                                    tagToAdd = ',VIP01';
                                } else {
                                    tagToAdd = ',VIP01-INT';
                                }
                            }
                            if(element.total_spent >= 600){
                                if(element.default_address.country == 'United States'){
                                    tagToAdd = ',VIP02';
                                } else {
                                    tagToAdd = ',VIP02-INT';
                                }
                            }
                            if(element.total_spent >= 1000){
                                if(element.default_address.country == 'United States'){
                                    tagToAdd = ',VIP03';
                                } else {
                                    tagToAdd = ',VIP03-INT';
                                }
                            }
                        }

                        //select the specific customer to update using their unique id then take their current tags and add the tags we have set to add above
                        var url = 'https://' + shop + '/admin/api/2019-07/customers/' + element.id + '.json';
                        var customerUpdate = {
                                "customer" : {
                                    "id" : element.id,
                                    "tags" : element.tags + tagToAdd
                                }
                        };

                        //Check if the customer has a total spent of 300, as to ignore all other customers. Then PUT the updated customer.
                        if(element.total_spent >= 300){
                            request.put(url, {
                                            method: "PUT",
                                            headers: shopRequestHeaders,
                                            body: customerUpdate,
                                            json: true
                                        })
                            .then((responseCustomer) => {
                                console.log(responseCustomer);
                                res.status(200);
                            })
                            .catch((error) =>{
                                console.log(error);
                                res.status(error.statusCode).send(error.error.error_description);
                            });
                        }
                        //each time the function runs increament x and compare it to the array length, this will slow down our api calls.
                        if (x++ < customerList.customers.length - 1) {
                            setTimeout(go, 2000);
                            console.log("delay");
                        }
                    }
                    //start the bulk tagging process.
                    go();
                })
                .catch((error) =>{

                });
              }
            }

        res.status(200).end('Started Auto-Tagging');
      })
      .catch((error) => {
        res.status(error.statusCode).send(error.error.error_description);
      });
    })
    .catch((error) => {
      res.status(error.statusCode).send(error.error.error_description);
    });

  } else {
    res.status(400).send('Required parameters missing');
  }
});
