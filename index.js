const express = require('express');
const { getLinkPreview, getPreviewFromContent } = require('link-preview-js');
const fs = require('fs');
const stream = require('stream');
const { promisify } = require('util');
const axios = require('axios');
const mongoose = require('mongoose');

const app = express();
const port = process.env.PORT || 80;
app.set('view engine', 'ejs');
app.set('views', './views');
app.use(express.static('./static'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const finished = promisify(stream.finished);

const clientPromise = mongoose.connect('TODO: insert your mongodb connection string');
mongoose.Promise = global.Promise;
mongoose.connection.on('error', (err)=>{
    console.error(`Mongoose fail: ${err.message}`);
});

require('./models/Recipe');
const Recipe = mongoose.model('Recipe');

app.get('/', async(req, res) => {
    try {
        const recipes = await Recipe.find();
        res.render('pages/index', {recipes: recipes});
    } catch(err) {
        console.error('failed', err);
    }
});

app.post('/recipe', async(req, res) => {
    try {
        console.log(req.body.recipeurl);
        const linkPreviewObj = await getLinkPreview(req.body.recipeurl);
        let filename = '';
        if (linkPreviewObj.images[0]) {
            const coverImageURL = linkPreviewObj.images[0];
            filename = uuidv4() + '.' + coverImageURL.split('.').pop();
            const path = './static/images/' + filename;
            await downloadFile(coverImageURL, path);
        }
        console.log(linkPreviewObj);
        const recipe = new Recipe({
            url: req.body.recipeurl,
            title: linkPreviewObj.title,
            siteName: linkPreviewObj.siteName,
            description: linkPreviewObj.description,
            coverImage: filename
        });
        await recipe.save();
        res.redirect('/');
    } catch(err) {
        console.error('failed', err);
    }
});

app.listen(port, () => {
    console.log(`Company Cookbook started and listening on port ${port}`);
});

//From: https://stackoverflow.com/questions/55374755/node-js-axios-download-file-stream-and-writefile
async function downloadFile(fileUrl, outputLocationPath) {
    const writer = fs.createWriteStream(outputLocationPath);
    return axios({
        method: 'get',
        url: fileUrl,
        responseType: 'stream',
    }).then(async response => {
        response.data.pipe(writer);
        return finished(writer); //this is a Promise
    });
}

function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}