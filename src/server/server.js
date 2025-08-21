// npm i dotenv express body-parser cors
import path from 'node:path';
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors'; // Import middleware CORS
import file_manager from './file_api.js';
import ctrl_acounts from './ctrl-acounts.js';
import fb_mutaion from './ctrl-fb-mutation.js';

export default async (__dirname, port = 1922) => {
    const app = express();

    // Middleware
    app.use(express.static('public'));
    app.use(cors());
    app.use(bodyParser.json());


    // Xử lý API
    file_manager(app, '/api', path.join(__dirname, '.data'));
    ctrl_acounts(app, __dirname);
    fb_mutaion(app, __dirname);

    // Start server
    app.listen(port, () => {
        console.log(`\nStart server on http://localhost:${port}`);
    });
}
