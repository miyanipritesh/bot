const { executablePath } = require("puppeteer-core");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const UserAgent = require("user-agents");
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const { randomInt } = require("crypto");
puppeteer.use(StealthPlugin());

async function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
const getRandomProxy = () => {
  try {
      const filePath = path.join(__dirname, 'proxies.txt');
      const data = fs.readFileSync(filePath, 'utf8');
      const proxies = data.split('\n').map(line => line.trim()).filter(Boolean);
      if (!proxies.length) throw new Error('Proxy list is empty.');
      const [host, port, user, pass] = proxies[Math.floor(Math.random() * proxies.length)].split(':');
      if (!host || !port || !user || !pass) throw new Error('Invalid proxy format.');
      return `${user}:${pass}:${host}:${port}`;
  } catch (error) {
      console.error('Error reading proxy file:', error.message);
      return null;
  }
};
const testProxy = async (proxy) => {
  const proxyIP = proxy.split(':')[2];
  const proxyPort = proxy.split(':')[3];

  console.log(`🛠️ Testing Proxy: ${proxyIP}:${proxyPort}...`);

  try {
      const response = await axios.get('http://ip-api.com/json/', {
          proxy: {
              host: proxyIP,
              port: parseInt(proxyPort),
              auth: {
                  username: proxy.split(':')[0],
                  password: proxy.split(':')[1],
                },
              
          },
          timeout: 5000, // 5 seconds timeout
      });

      if (response.data.status === 'fail') {
          console.log('❌ Proxy failed:', response.data.message);
          return false;
      }

      console.log(`✅ Proxy is working! IP: ${response.data.query}, Country: ${response.data.country}`);
      return response.data; // Return proxy details

  } catch (error) {
      console.log(`❌ Proxy Test Failed: ${error.message}`);
      return false;
  }
};
    // Function to scroll to the bottom
    async function scrollToBottom(page) {
      await page.evaluate(async () => {
          await new Promise((resolve) => {
              let totalHeight = 0;
              const distance = 100; // Adjust scroll step
              const timer = setInterval(() => {
                  const scrollHeight = document.body.scrollHeight;
                  window.scrollBy(0, distance);
                  totalHeight += distance;

                  if (totalHeight >= scrollHeight) {
                      clearInterval(timer);
                      resolve();
                  }
              }, 100);
          });
      });
  }

  // Function to scroll to the top
  async function scrollToTop(page) {
      await page.evaluate(async () => {
          await new Promise((resolve) => {
              const distance = 100; // Adjust scroll step
              const timer = setInterval(() => {
                  window.scrollBy(0, -distance);

                  if (window.scrollY <= 0) {
                      clearInterval(timer);
                      resolve();
                  }
              }, 100);
          });
      });
  }
async function humanScroll(page) {
  
  let lastHeight = await page.evaluate(() => document.body.scrollHeight);
    
    // Scroll from top to bottom
    await page.evaluate(() => {
        window.scrollTo(0, 0); // Start at the top
    });

    // Scroll down the page
    while (true) {
        await page.evaluate(() => {
            window.scrollBy({ top: Math.floor(Math.random() * 500) + 200, behavior: "smooth" });
        });
        await wait(Math.floor(Math.random() * 1000) + 500); // Random delay

        let newHeight = await page.evaluate(() => document.body.scrollHeight);
        if (newHeight === lastHeight) {
            break; // Stop scrolling if we reach the bottom
        }
        lastHeight = newHeight; // Update the last height
    }

    // Scroll back to the top
    await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight); // Start at the bottom
    });

    // Scroll up the page
    while (window.scrollY > 0) {
        await page.evaluate(() => {
            window.scrollBy({ top: -(Math.floor(Math.random() * 500) + 200), behavior: "smooth" });
        });
        await wait(Math.floor(Math.random() * 1000) + 500); // Random delay
    }

    console.log("Full page scrolled from top to bottom and back to top.");
    // let lastHeight = await page.evaluate(() => document.body.scrollHeight);

    // while (true) {
    //     await page.evaluate(() => {
    //         window.scrollBy({ top: Math.floor(Math.random() * 500) + 1000, behavior: "smooth" });
    //     });

    //     await wait(Math.floor(Math.random() * 1000) + 500);

    //     let newHeight = await page.evaluate(() => document.body.scrollHeight);
    //     if (newHeight === lastHeight) break;
    //     lastHeight = newHeight;
    // }
}

async function runBot() {
    const userAgent = new UserAgent({deviceCategory:'desktop'});
    const proxy = getRandomProxy();

    if (!proxy) {
        console.log("⚠️ No valid proxy available. Skipping browser launch.");
        return;
    }

    const proxyData = await testProxy(proxy);
    if (!proxyData) {
        console.log("⏭️ Skipping this proxy. Trying another...");
        return; // Stop execution if proxy is not working
    }
    const proxyURL = proxy.split(':')[2]+':'+proxy.split(':')[3];
    const browser = await puppeteer.launch({
        headless: 'new', 
        executablePath:'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        args: [
          `--proxy-server=${proxyURL}`,
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-blink-features=AutomationControlled",
            "--disable-dev-shm-usage",
            "--disable-infobars",
            "--window-size=1920,1080"
        ]
    });

    const page = await browser.newPage();
    await page.authenticate({ username: proxy.split(':')[0], password:proxy.split(':')[1] });
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      Referer: 'https://www.google.com/'
    });
    await page.setUserAgent(userAgent.toString());

    await page.setViewport({
        width: userAgent.data.viewportWidth || 1366,
        height: userAgent.data.viewportHeight || 768,
        deviceScaleFactor: 1,
        hasTouch: false,
      //  isLandscape: true,
      
    });

    // await page.setRequestInterception(true);
    // page.on("request", (req) => {
    //     const blockTypes = ["image", "stylesheet", "font"];
    //     if (blockTypes.includes(req.resourceType())) {
    //         req.abort();
    //     } else {
    //         req.continue();
    //     }
    // });

    const url = "https://cryptorbite.com/solana-sol/"; 
    await page.goto(url, { waitUntil: "networkidle2" });//networkidle2
  //  await page.waitForSelector('footer', { visible: true });  
      console.log("Page fully loaded.");
      await wait(20000);
   // await humanScroll(page);
   console.log('Scrolling down...');
   await scrollToBottom(page);
   await wait(20000);
   console.log('Scrolling up...');
   await scrollToTop(page);
   await wait(20000);
    const waitTime = Math.floor(Math.random() * 120000) + 180000;
    console.log(`Spending time on the website for ${waitTime / 1000} seconds...`);
    await wait(waitTime);

    await browser.close();
    console.log("Session completed.");
}





async function runBotWithDelay() {

  for (let i = 0; i < 100000; i++) {
    //  console.log(`Processing item ${items[i]}`);
    runBot().catch(console.error);
      // for(let j=0;j<Math.floor(Math.random() * (3 - 1 + 1)) + 1;j++){
       
      // }
      // Add a delay between iterations (random delay between 10s and 30s)
      await wait(Math.floor(Math.random() * 20000) + 10000); // Delay 10-30 seconds

     // console.log(`Item ${items[i]} processed.`);
  }

  console.log("Loop completed.");
}

runBotWithDelay().catch(console.error);