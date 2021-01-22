const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

const result = dotenv.config();

if (result.error) {
  console.log(result.error);
  throw result.error;
}

const { JWT_SECRET, JWT_EXPIRES_IN, JWT_COOKIE_EXPIRES, ENVTEST } = result.parsed;
const jwt_secret = process.env.JWT_SECRET || JWT_SECRET;
const jwt_expires_in = process.env.JWT_EXPIRES_IN || JWT_EXPIRES_IN;
const envtest = process.env.ENVTEST || ENVTEST;
const jwt_cookie_expires = parseInt(process.env.JWT_COOKIE_EXPIRES || JWT_COOKIE_EXPIRES);
// Creates a new account
const register = (logger, connection, req, res, next) => {
  // console.table(req.body);
  // logger.trace(req.body);
  const { firstName, lastName, email, password } = req.body;
  if (!email) {
    logger.error({
      message: 'Please provide an email to create an account.',
      title: 'No email provided!',
      type: 'error'
    });
    res.status(401).send({
      message: 'Please provide an email to create an account.',
      title: 'No email provided!',
      type: 'error'
    });
  } else if (!password) {
    logger.error({
      message: 'Please provide a password.',
      title: 'No password provided!',
      type: 'error'
    });
    res.status(401).send({
      message: 'Please provide a password.',
      title: 'No password provided!',
      type: 'error'
    });
  } else {
    connection.query('SELECT `Email` FROM `USERS` WHERE `Email` = ?', [email], async (error, result) => {
      if (error) {
        // console.log(error);
        logger.error(error);
        next(error);
      }
      // console.log(result);
      if (result && result.length > 0) {
        logger.error({
          message: 'Please try a different email.',
          title: 'Email already registered!',
          type: 'error'
        });
        res.status(401).send({
          message: 'Please try a different email.',
          title: 'Email already registered!',
          type: 'error'
        });
      } else {
        // console.table(result);
        // logger.debug(result);

        // Encrypt password
        let hashedPassword = await bcrypt.hash(password, 10);
        // console.log(hashedPassword);
        // logger.trace(hashedPassword);
        connection.query(
          'INSERT INTO `USERS` SET ?',
          {
            First_Name: firstName,
            Last_Name: lastName,
            Email: email,
            Password: hashedPassword
          },
          (error, result) => {
            if (error) {
              // console.log(error);
              logger.error(error);
              next(error);
            } else {
              // console.log(result);
              // logger.debug(result);
              logger.info({
                message: 'Please login with your new account details.',
                title: 'Registration successful!',
                type: 'success'
              });
              res.status(200).send({
                message: 'Please login with your new account details.',
                title: 'Registration successful!',
                type: 'success'
              });
            }
          }
        );
      }
    });
  }
}
// Signs user in
const login = (logger, connection, req, res) => {
  console.table(req.body);
  const { email, password } = req.body;
  if (!email) {
    logger.error({
      message: 'Please provide an email to login.',
      title: 'No email provided!',
      type: 'error',
      error: req.body
    });
    res.status(401).send({
      message: 'Please provide an email to login.',
      title: 'No email provided!',
      type: 'error',
      error: req.body
    });
  } else if (!password) {
    logger.error({
      message: 'Please provide a password.',
      title: 'No password provided!',
      type: 'error'
    });
    res.status(401).send({
      message: 'Please provide a password.',
      title: 'No password provided!',
      type: 'error'
    });
  } else {
    connection.query('SELECT * FROM `USERS` WHERE `Email` = ?', [email], async (error, result) => {
      // console.log(result);
      // logger.trace(result);
      if (!result || (result && result.length === 0)) {
        logger.error({
          message: 'Please check your email and try again.',
          title: 'Email not registered!',
          type: 'error'
        });
        res.status(401).send({
          message: 'Please check your email and try again.',
          title: 'Email not registered!',
          type: 'error'
        });
      } else if (!(await bcrypt.compareSync(password, result[0].Password))) {
        logger.error({
          message: 'Please double-check your password.',
          title: 'Incorrect password!',
          type: 'error'
        });
        res.status(401).send({
          message: 'Please double-check your password.',
          title: 'Incorrect password!',
          type: 'error'
        });
      } else {
        const id = result[0].User_ID;
        const token = jwt.sign({ id }, jwt_secret, {
          expiresIn: jwt_expires_in
        });
        // console.log('The token is: ' + token);
        logger.info({
          message: 'You have been successfully logged in.',
          title: 'Login successful!',
          type: 'success',
          token
        });
        res.status(200).send({
          message: 'You have been successfully logged in.',
          title: 'Login successful!',
          type: 'success',
          token
        });
      }
    });
  }
}

// Checks to see if user is logged in
const isLoggedIn = (logger, connection, token, res, redirect = false) => {
  if (!token) {
    logger.warn('401`- Unauthorized!');
    res.status(401).send({
      message: 'You need to be logged in to access this page.',
      title: 'Access Denied!',
      type: 'error'
    });
  } else {
    const decoded = jwt.verify(token, jwt_secret);
    // console.log(decoded);
    if (decoded.exp > 0) {
      connection.query('SELECT * FROM `USERS` WHERE `User_ID` = ?', [decoded.id], async (error, result) => {
        // console.log(result[0]);
        const { First_Name, Last_Name, Email } = result[0];
        logger.info({ First_Name, Last_Name, Email });
        if (redirect) {
          return;
        } else {
          res.status(200).send({ First_Name, Last_Name, Email });
        }
      });
    } else {
      logger.warn('401`- Unauthorized!');
      res.status(401).send({
        message: 'You need to be logged in to access this page.',
        title: 'Access Denied!',
        type: 'error'
      });
    }
  }
}

module.exports = Object.assign({
  register,
  login,
  isLoggedIn
});