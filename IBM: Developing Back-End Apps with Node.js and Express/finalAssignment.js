const express = require('express');
const jsonwebtoken = require('jsonwebtoken');

const app = express();

const JWT_SECTRET = 'bookstore';

let bookStore = [
    {
        title: 'harry porter',
        author: 'j.k. rowling',
        isbn: 1001,
        rating: [4.3, 4.4],
        review: ['very good', 'amazing']
    },
    {
        title: 'the ink black heart',
        author: 'j.k. rowling',
        isbn: 1002,
        rating: [3.7, 3.5],
        review: ['good']
    },
    {
        title: 'murder on the orient express',
        author: 'agatha christie',
        isbn: 1003,
        rating: [4.5, 4.5],
        review: ['superb', 'amazing']
    },
    {
        title: 'death on the nile',
        author: 'agatha christie',
        isbn: 1004,
        rating: [4.5, 4.6],
        review: ['simply wonderful', 'fantastic']
    },
    {
        title: 'the catcher in the rye',
        author: 'j.d. salinger',
        isbn: 1005,
        rating: [4.0, 4.1],
        review: ['great', 'nice']
    }
];

const users = [];

app.use(express.urlencoded({extended: false}));

// retrieves all books
app.get('/list', (req, res) => res.status(200).json(bookStore).end());

// retrieves all books filtered using title, author and isbn
app.get('/search/title/:title', (req, res) => {
    const newBookStore = bookStore.filter(book => book.title === req.params.title);
    res.status(200).json(newBookStore).end()
});
app.get('/search/author/:author', (req, res) => {
    const newBookStore = bookStore.filter(book => book.author === req.params.author);
    res.status(200).json(newBookStore).end()
});
app.get('/search/isbn/:isbn', (req, res) => {
    const newBookStore = bookStore.filter(book => book.isbn === Number(req.params.isbn));
    res.status(200).json(newBookStore).end()
});

// retrieves ratings/reviews for specified books
app.get('/search/ratings/:title', (req, res) => {
    let newBookStore = bookStore.filter(book => book.title === req.params.title);
    newBookStore = newBookStore.map(book => ({title: book.title, rating: book.rating}));
    res.status(200).json(newBookStore).end()
});
app.get('/search/reviews/:title', (req, res) => {
    let newBookStore = bookStore.filter(book => book.title === req.params.title);
    newBookStore = newBookStore.map(book => ({title: book.title, review: book.review}));
    res.status(200).json(newBookStore).end()
});

// to register a new user
app.post('/register', (req, res) => {
    users.push(req.body);
    res.status(200).send(`${req.body.username} Registered Succesfully!`).end();
});

// user login and jwt sent back on successful authentication
app.post('/login', (req, res) => {
    const credentials = req.body;
    const userExists = users.find((user) => user.username === credentials.username);
    if(userExists) {
        if( credentials.password === userExists.password)
            return res.status(200).json({token: jsonwebtoken.sign({username: userExists.username}, JWT_SECTRET)}).end();
        else
            return res.status(401).send('Invalid credentials entered.').end();
    }
    else
        return res.status(401).send('No such user exists!').end();
});

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader.split(' ')[1];
    if(token) {
        jsonwebtoken.verify(token, JWT_SECTRET, (error, user) => {
            if(error)
                return res.status(403).send('Token could not be verified.');
            next();
        });
    }
    else {
        return res.send('Token not valid!');
    }
};

// registered users can add review for a book by giving the title and their token
// to authenticate
app.post('/addreview', authenticateToken, (req, res) => {
    const sentData = req.body;
    const newBookStore = bookStore.map((book) => {
        if(book.title === sentData.title) {
            return {
                ...book,
                review: [...book.review, sentData.review]
            };
        }
        return book;
    });
    if(JSON.stringify(newBookStore) === JSON.stringify(bookStore)) {
        return res.status(403).send('No book with entered title exists.!').end();  
    }
    bookStore = newBookStore;
    res.status(200).send('Review added successfully!').end();
});

// registered users can modify an already existing review for a book by giving the title,
// old review, and the new review with their token to authenticate
app.put('/modifyreview', authenticateToken, (req, res) => {
    const sentData = req.body;
    const newBookStore = bookStore.map((book) => {
        if(book.title === sentData.title) {
            return {
                ...book,
                review: book.review.map((data) => {
                    if(data === sentData.oldreview)
                        return data.replace(data, sentData.newreview);
                    return data;
                })
            };
        }
        return book;
    });
    if(JSON.stringify(newBookStore) === JSON.stringify(bookStore)) {
        return res.status(403).send('Either no book with entered title exists or old review does not exist in the specified book.!').end();
    }
    bookStore = newBookStore;
    res.status(200).send('Review modified successfully!').end();
});

// registered users can delete an already existing review for a book by giving the title,
// and old review with their token to authenticate
app.delete('/deletereview', authenticateToken, (req, res) => {
    console.log(bookStore);
    const sentData = req.body;
    const newBookStore = bookStore.map((book) => {
        if(book.title === sentData.title) {
            return {
                ...book,
                review: book.review.filter((data) => data !== sentData.review)
            };
        }
        return book;
    });
    if(JSON.stringify(newBookStore) === JSON.stringify(bookStore)) {
        return res.status(403).send('Either no book with entered title exists or no such review exists.!').end();  
    }
    bookStore = newBookStore;
    console.log(bookStore);
    res.status(200).send('Review deleted successfully!').end();
});

app.listen(5000, () => {
    console.log('Server is listening at 5000...');
});
