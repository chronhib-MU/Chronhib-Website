"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
var jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
var bcryptjs_1 = __importDefault(require("bcryptjs"));
var dotenv_1 = __importDefault(require("dotenv"));
var result = dotenv_1.default.config();
if (result.error) {
    console.log(result.error);
    throw result.error;
}
var jwt_secret = process.env.JWT_SECRET || ((_a = result.parsed) === null || _a === void 0 ? void 0 : _a.JWT_SECRET) || '';
var jwt_expires_in = process.env.JWT_EXPIRES_IN || ((_b = result.parsed) === null || _b === void 0 ? void 0 : _b.JWT_EXPIRES_IN);
// const envtest = process.env.ENVTEST || ENVTEST;
// const jwt_cookie_expires = parseInt(process.env.JWT_COOKIE_EXPIRES || JWT_COOKIE_EXPIRES);
// Creates a new account
var register = function (logger, connection, firstName, lastName, email, password, res, next) {
    // console.table(reqBody);
    // logger.trace(reqBody);
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
    }
    else if (!password) {
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
    }
    else {
        connection.query('SELECT `Email` FROM `USERS` WHERE `Email` = ?', [email], function (error, result) { return __awaiter(void 0, void 0, void 0, function () {
            var hashedPassword;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (error) {
                            // console.log(error);
                            logger.error(error);
                            next(error);
                        }
                        if (!(result && result.length > 0)) return [3 /*break*/, 1];
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
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, bcryptjs_1.default.hash(password, 10)];
                    case 2:
                        hashedPassword = _a.sent();
                        // console.log(hashedPassword);
                        // logger.trace(hashedPassword);
                        connection.query('INSERT INTO `USERS` SET ?', {
                            First_Name: firstName,
                            Last_Name: lastName,
                            Email: email,
                            Password: hashedPassword
                        }, function (error) {
                            if (error) {
                                // console.log(error);
                                logger.error(error);
                                next(error);
                            }
                            else {
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
                        });
                        _a.label = 3;
                    case 3: return [2 /*return*/];
                }
            });
        }); });
    }
};
exports.register = register;
// Signs user in
var login = function (logger, connection, email, password, res) {
    var reqBody = { email: email, password: password };
    console.table(reqBody);
    if (!email) {
        logger.error({
            message: 'Please provide an email to login.',
            title: 'No email provided!',
            type: 'error',
            error: reqBody
        });
        res.status(401).send({
            message: 'Please provide an email to login.',
            title: 'No email provided!',
            type: 'error',
            error: reqBody
        });
    }
    else if (!password) {
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
    }
    else {
        connection.query('SELECT * FROM `USERS` WHERE `Email` = ?', [email], function (_error, result) {
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
            }
            else if (!(bcryptjs_1.default.compareSync(password, result[0].Password))) {
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
            }
            else {
                var id = result[0].User_ID;
                var token = jsonwebtoken_1.default.sign({ id: id }, jwt_secret, {
                    expiresIn: jwt_expires_in
                });
                // console.log('The token is: ' + token);
                logger.info({
                    message: 'You have been successfully logged in.',
                    title: 'Login successful!',
                    type: 'success',
                    token: token
                });
                res.status(200).send({
                    message: 'You have been successfully logged in.',
                    title: 'Login successful!',
                    type: 'success',
                    token: token
                });
            }
        });
    }
};
exports.login = login;
// Checks to see if user is logged in
var isLoggedIn = function (logger, connection, token, res, redirect) {
    if (redirect === void 0) { redirect = false; }
    if (!token) {
        logger.warn('401`- Unauthorized!');
        res.status(401).send({
            message: 'You need to be logged in to access this page.',
            title: 'Access Denied!',
            type: 'error'
        });
    }
    else {
        var decoded = jsonwebtoken_1.default.verify(token, jwt_secret);
        // console.log(decoded);
        if (decoded.exp > 0) {
            connection.query('SELECT * FROM `USERS` WHERE `User_ID` = ?', [decoded.id], function (_error, result) {
                // console.log(result[0]);
                var _a = result[0], First_Name = _a.First_Name, Last_Name = _a.Last_Name, Email = _a.Email;
                logger.info({ First_Name: First_Name, Last_Name: Last_Name, Email: Email });
                if (redirect) {
                    return;
                }
                else {
                    res.status(200).send({ First_Name: First_Name, Last_Name: Last_Name, Email: Email });
                }
            });
        }
        else {
            logger.warn('401`- Unauthorized!');
            res.status(401).send({
                message: 'You need to be logged in to access this page.',
                title: 'Access Denied!',
                type: 'error'
            });
        }
    }
};
exports.isLoggedIn = isLoggedIn;
//# sourceMappingURL=auth.js.map