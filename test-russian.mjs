import https from 'https';

const email = process.env.ATLASSIAN_EMAIL || '';
const token = process.env.ATLASSIAN_TOKEN || '';

if (!email || !token) {
  throw new Error('Set ATLASSIAN_EMAIL and ATLASSIAN_TOKEN before running this script.');
}

const pageId = "589365250";
const auth = Buffer.from(`${email}:${token}`).toString('base64');

// Get current page
const getOptions = {
  hostname: 'shiptify.atlassian.net',
  path: `/wiki/rest/api/content/${pageId}?expand=body.storage,version`,
  method: 'GET',
  headers: {
    'Authorization': `Basic ${auth}`,
    'Accept': 'application/json'
  }
};

console.log('Getting current page...');

https.request(getOptions, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    if (res.statusCode !== 200) {
      console.log(`Error: ${res.statusCode}`);
      console.log(data);
      return;
    }
    
    const pageData = JSON.parse(data);
    console.log(`Current title: ${pageData.title}`);
    console.log(`Current version: ${pageData.version.number}`);
    
    const newVersion = pageData.version.number + 1;
    const newTitle = "Тест через Node.js - Русский текст";
    
    const newContent = `<h1>Тестирование Node.js - Русский язык</h1>
<p>Это содержимое на русском языке, отправленное через Node.js.</p>
<h2>Проверка кодировки UTF-8</h2>
<p>Если этот текст отображается корректно на русском языке, то Node.js правильно обрабатывает UTF-8!</p>
<ul>
  <li>Пункт первый: тестирование русского текста</li>
  <li>Пункт второй: проверка кодировки</li>
  <li>Пункт третий: сохранение контента</li>
  <li>Буквы: А Б В Г Д Е Ё Ж З И Й К Л М Н О П Р С Т У Ф Х Ц Ч Ш Щ Ъ Ы Ь Э Ю Я</li>
</ul>`;
    
    const updatePayload = {
      version: {
        number: newVersion
      },
      title: newTitle,
      type: "page",
      body: {
        storage: {
          value: newContent,
          representation: "storage"
        }
      }
    };
    
    const bodyString = JSON.stringify(updatePayload);
    const bodyBuffer = Buffer.from(bodyString, 'utf8');
    
    console.log(`\nNew title: ${newTitle}`);
    console.log(`New version: ${newVersion}`);
    console.log('Updating page with Russian content...\n');
    
    // Update page
    const putOptions = {
      hostname: 'shiptify.atlassian.net',
      path: `/wiki/rest/api/content/${pageId}`,
      method: 'PUT',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': bodyBuffer.length
      }
    };
    
    https.request(putOptions, (putRes) => {
      let putData = '';
      
      putRes.on('data', (chunk) => {
        putData += chunk;
      });
      
      putRes.on('end', () => {
        if (putRes.statusCode === 200) {
          console.log('✅ Update successful!');
          
          // Verify
          console.log('\nVerifying content...');
          https.request(getOptions, (checkRes) => {
            let checkData = '';
            
            checkRes.on('data', (chunk) => {
              checkData += chunk;
            });
            
            checkRes.on('end', () => {
              const verified = JSON.parse(checkData);
              console.log(`Saved title: ${verified.title}`);
              console.log(`Content preview (first 300 chars):`);
              console.log(verified.body.storage.value.substring(0, 300));
            });
          }).end();
        } else {
          console.log(`Error: ${putRes.statusCode}`);
          console.log(putData);
        }
      });
    }).end(bodyBuffer);
  });
}).end();
