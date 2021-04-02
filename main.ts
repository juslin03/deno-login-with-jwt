import { opine, json, urlencoded } from 'https://deno.land/x/opine@1.2.0/mod.ts';
import { create, verify, getNumericDate } from 'https://deno.land/x/djwt@v2.2/mod.ts';
import { User, Article } from './types.ts';

const db = JSON.parse(Deno.readTextFileSync('./db.json'));
const articles = JSON.parse(Deno.readTextFileSync('./articles.json'));

const app = opine();

app.use(json());
app.use(urlencoded());

app.get('/', (req, res) => {
    res.setStatus(200);
    res.send(
        `
            <h2>Hello, login to continue</h2>
            <p>Clique <a href='/login'>here</a> to login.</p>
        `
    );
})
app.get('/register', (req, res) => {
    res.send(
        `<div>
            <h2>Please register</h2>
            <form action='/register' method='POST'>
                <input type='text' name='username' id='username' placeholder='enter your username' /><br />
                <input type='password' name='password' id='password' placeholder='xxxxxxx' /><br />
                <input type='submit' value='Sign up' />
            </form>
        </div>`
    );
});

app.post('/register', (req, res) => {
    
    const newUser: User = {
        username: req.body.username,
        password: req.body.password,
        jwt: ''
    };

    db.users.push(newUser);
    console.log(newUser);
    res.redirect(301, '/login');
})

app.get('/login', (req, res) => {
    
    res.send(
        `<div>
            <h1>Welcome to jwt</h1>
            <h2>Please login to continue</h2>
            <form action='/login' method='POST'>
                <input type='text' name='username' placeholder='enter your username' /><br />
                <input type='password' name='password' placeholder='xxxxxxx' /><br />
                <input type='submit' value='Login' />
            </form>
            <p>Clique <a href='/register'>here</a> to Register.</p>
        </div>`
    );
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    
    const result: User = db.users.find((user: User) => {
        return user.username === username && user.password === password;
    });

    if(result) {
        const jwtPromise = create(
            { alg: 'HS512', type: 'JWT' },
            { username: result.username, exp: getNumericDate(1*60) },
            result.password
        );

        jwtPromise.then((jwt: string) => {
            result.jwt = jwt;
            res.setStatus(201);
            res.send(
                `<h1>Here is you token </h1><br/>
                <p>${jwt}</p>
                `
            );
            console.table(db.users);
        }).catch((e: string) => {
            res.setStatus(500);
            res.send(
                `
                    <h2>Error of the server</h2>
                `
            );
            console.log(e);
        });
    } else {
        res.setStatus(404);
        res.send(
            `<p>User Not found</p>`
        )
    }
});

app.get('/articles', (req, res) => {
    const auth = req.headers.get('Authorization');

    if(!auth || auth === '' || auth === undefined) {
        res.setStatus(401);
        res.send(
            `<h2>Not authorized, you must be login before</p>`
        )
    }else {
        const token = auth.split(' ')[1];
        const result = db.users.find((user: User) => {
            return user.jwt === token;
        });

        if(result) {
            const payloadPromise = verify(result.jwt, result.password, 'HS512');
            payloadPromise.then((payload) => {
                console.log('Payload: ', payload);
                const listArticles = articles.news.map((article: Article) => {
                    return  `<li>${article.headlines}</li>`
                });
                let html: string = `<ul>`;
                for(let i = 0; i < listArticles.length; i++) {
                    html += listArticles[i];
                }
                html += `</ul>`;

                res.send(
                    `
                        <div>
                            <h2>Today's news </h2>
                            ${html}
                        </div>
                    `
                )
            }).catch(e => {
                result.jwt = '';
                console.log(db.users);
                res.send(`<p>Token has expired, please login again</p>`);
                console.error(e);
            });


        } else {
            res.setStatus(404);
            res.send(`<p>Not such user</p>`)
        }
    }
})

app.listen(5000, () => console.log(`App started`));