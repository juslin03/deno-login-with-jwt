import { Request, Response, NextFunction } from 'https://deno.land/x/opine@1.2.0/mod.ts'
import { verify } from 'https://deno.land/x/djwt@v2.2/mod.ts';

import{ User } from './types.ts';

const db = JSON.parse(Deno.readTextFileSync('./db.json'));

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const auth = req.headers.get('Authorization');

    if(!auth || auth === '' || auth === undefined) {
        res.setStatus(401);
        res.send(
            `<h2>Not authorized, you must be login before</p>`
        )
    }else {
        next();
        const token = auth.split(' ')[1];
        const result = db.users.find((user: User) => {
            return user.jwt === token;
        });

        if(result) {
            const payloadPromise = verify(result.jwt, result.password, 'HS512');
            payloadPromise.then((payload) => {
                console.log('Payload: ', payload);
            })
        }
    }
}