require('express-async-errors');

const express = require('express');
const app = express();

app.use(express.json());

app.use('/', require('./routes/verification'));
app.use('/classrooms', require('./routes/classrooms'));
app.use('/students', require('./routes/students'));
app.use('/supplies', require('./routes/supplies'));

app.get('/', (req, res) => {
    res.json({
        message: "API server is running"
    });
});

app.use((err, req, res, next) => {
    console.error(err);
    res.status(400);

    if (!err.hasOwnProperty('name')) {
        err = {
            name: "BadRequest",
            ...err,
        }
    };

    res.json(err);
});

app.use((req, res) => {
    res.status(404);
    res.json({
        error: 'Not Found'
    });
});

const port = 8000;
app.listen(port, () => console.log('Server is listening on port', port));
