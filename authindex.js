console.log(`Forked by xxspell | https://github.com/xxspell`);
import puppeteer from 'puppeteer';
import fs from 'fs';
import readline from 'readline';
import promptSync from 'prompt-sync';





(async () => {
    const browser = await puppeteer.launch({
        headless: false
    });
    const rl = readline.createInterface({
        input: fs.createReadStream('accounts.txt'),
        crlfDelay: Infinity
    });
    const sessions = [];
    for await (const line of rl) {
        const loginSearch = line.match(/(.+)\s+/);
        const [completeMatch, login] = loginSearch;
        const password = line.slice(completeMatch.length);
        console.log(`Захожу на аккаунт ${login} ${password}`);
        const context = await browser.createIncognitoBrowserContext();
        const page = await context.newPage();
        await page.goto("https://vk.com", {
            waitUntil: "domcontentloaded"
        });
        await page.type('#index_email', login);
	await page.click('.VkIdForm__signInButton');
    await page.waitForNavigation({
        waitUntil: 'networkidle0',
      });
      function sleep(ms) { 
        return new Promise((resolve) => { 
            setTimeout(resolve, ms); 
        }); 
    } 
      async function captchaSolving() {
        await page.screenshot({ path: 'captcha.png', fullPage: true });
        console.log('В captcha.png находится капча, откройте его и разгадайте шифр');
        const prompt = promptSync();   
        const captchadone = prompt("Какой шифр?  ");
        await page.type('.vkc__TextField__input', captchadone);
        await page.click('.vkuiButton__in');
        await sleep(4000); 
        
        
}



    if (await page.$('.vkc__Captcha__image') !== null) {
        console.log(`Вылезла капча`)
        captchaSolving ();
        await sleep(2000)
        if (await page.$('.vkc__Captcha__image') !== null) {
            await console.log(`Кажется капча неверная, попробуем снова`)
            captchaSolving ();
        } else {
                await console.log(`Капча успешно пройдена`);
            }
    } else {
        console.log(`Повезло, что капчи нет`)
    }
	await page.waitForSelector('.vkc__Password__Wrapper', {timeout: 120000});
        await page.type('.vkc__Password__Wrapper', password);
        await page.click('.vkuiButton');
        await sleep(4000); 
    if (await page.$('.vkc__TextField__errorMessage') !== null) {     
    console.log(`Походу неверный пароль, скип`)
    // <div class="vkc__TextField__errorMessage">Неверный пароль</div>

    } else {
        await console.log(`ессс`)
        await sleep(4000);
        if (await page.$('.login_blocked_wrap') !== null) {
            console.log(`Аккаунт заблокирован, скип`);
        } else {
            // await page.waitForNavigation();
            const cookies = await page.cookies();
            const resCookies = [];
            for (let i = 0; i < cookies.length; i++) {
                resCookies.push(`${cookies[i].name}=${cookies[i].value}`);
            }
            sessions.push(resCookies.join('; '));
            await fs.promises.writeFile('sessions.json', JSON.stringify(sessions));
            console.log(`Сессия аккаунта ${login} ${password} сохранена`);
            
        
        };
        await context.close();};
        
    }
    await browser.close();
})();
