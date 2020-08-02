!function(){function t(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}function e(t,e){for(var b=0;b<e.length;b++){var n=e[b];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(t,n.key,n)}}function b(t,b,n){return b&&e(t.prototype,b),n&&e(t,n),t}(window.webpackJsonp=window.webpackJsonp||[]).push([[6],{PTPi:function(e,n,o){"use strict";o.r(n),o.d(n,"AuthLayoutModule",(function(){return u}));var i,r,c,a=o("tyNb"),s=o("ofXK"),p=o("3Pt+"),l=o("fXoL"),d=[{path:"login",component:(r=function(){function e(){t(this,e)}return b(e,[{key:"ngOnInit",value:function(){}},{key:"ngOnDestroy",value:function(){}}]),e}(),r.\u0275fac=function(t){return new(t||r)},r.\u0275cmp=l.Eb({type:r,selectors:[["app-login"]],decls:65,vars:0,consts:[[1,"header","bg-gradient-image","py-7","py-lg-8"],[1,"container"],[1,"header-body","text-center","mb-7"],[1,"row","justify-content-center"],[1,"col-lg-5","col-md-6"],[1,"text-white"],[1,"text-lead","text-light"],[1,"separator","separator-bottom","separator-skew","zindex-100"],["x","0","y","0","viewBox","0 0 2560 100","preserveAspectRatio","none","version","1.1","xmlns","http://www.w3.org/2000/svg"],["points","2560 0 2560 100 0 100",1,"fill-default"],[1,"container","mt--8","pb-5"],[1,"col-lg-5","col-md-7"],[1,"card","bg-secondary","shadow","border-0"],[1,"card-header","bg-transparent","pb-5"],[1,"text-muted","text-center","mt-2","mb-3"],[1,"btn-wrapper","text-center"],["href","javascript:void(0)",1,"btn","btn-neutral","btn-icon"],[1,"btn-inner--icon"],["src","../assets/img/icons/common/github.svg"],[1,"btn-inner--text"],["src","../assets/img/icons/common/google.svg"],[1,"card-body","px-lg-5","py-lg-5"],[1,"text-center","text-muted","mb-4"],["role","form"],[1,"form-group","mb-3"],[1,"input-group","input-group-alternative"],[1,"input-group-prepend"],[1,"input-group-text"],[1,"ni","ni-email-83"],["placeholder","Email","type","email",1,"form-control"],[1,"form-group"],[1,"ni","ni-lock-circle-open"],["placeholder","Password","type","password",1,"form-control"],[1,"custom-control","custom-control-alternative","custom-checkbox"],["id"," customCheckLogin","type","checkbox",1,"custom-control-input"],["for"," customCheckLogin",1,"custom-control-label"],[1,"text-muted"],[1,"text-center"],["type","button",1,"btn","btn-primary","my-4"],[1,"row","mt-3"],[1,"col-6"],["href","javascript:void(0)",1,"text-light"],[1,"col-6","text-right"]],template:function(t,e){1&t&&(l.Pb(0,"div",0),l.Pb(1,"div",1),l.Pb(2,"div",2),l.Pb(3,"div",3),l.Pb(4,"div",4),l.Pb(5,"h1",5),l.Bc(6,"Welcome!"),l.Ob(),l.Pb(7,"p",6),l.Bc(8," Use these awesome forms to login or create new account in your project for free. "),l.Ob(),l.Ob(),l.Ob(),l.Ob(),l.Ob(),l.Pb(9,"div",7),l.dc(),l.Pb(10,"svg",8),l.Lb(11,"polygon",9),l.Ob(),l.Ob(),l.Ob(),l.cc(),l.Pb(12,"div",10),l.Pb(13,"div",3),l.Pb(14,"div",11),l.Pb(15,"div",12),l.Pb(16,"div",13),l.Pb(17,"div",14),l.Pb(18,"small"),l.Bc(19,"Sign in with"),l.Ob(),l.Ob(),l.Pb(20,"div",15),l.Pb(21,"a",16),l.Pb(22,"span",17),l.Lb(23,"img",18),l.Ob(),l.Pb(24,"span",19),l.Bc(25,"Github"),l.Ob(),l.Ob(),l.Pb(26,"a",16),l.Pb(27,"span",17),l.Lb(28,"img",20),l.Ob(),l.Pb(29,"span",19),l.Bc(30,"Google"),l.Ob(),l.Ob(),l.Ob(),l.Ob(),l.Pb(31,"div",21),l.Pb(32,"div",22),l.Pb(33,"small"),l.Bc(34,"Or sign in with credentials"),l.Ob(),l.Ob(),l.Pb(35,"form",23),l.Pb(36,"div",24),l.Pb(37,"div",25),l.Pb(38,"div",26),l.Pb(39,"span",27),l.Lb(40,"i",28),l.Ob(),l.Ob(),l.Lb(41,"input",29),l.Ob(),l.Ob(),l.Pb(42,"div",30),l.Pb(43,"div",25),l.Pb(44,"div",26),l.Pb(45,"span",27),l.Lb(46,"i",31),l.Ob(),l.Ob(),l.Lb(47,"input",32),l.Ob(),l.Ob(),l.Pb(48,"div",33),l.Lb(49,"input",34),l.Pb(50,"label",35),l.Pb(51,"span",36),l.Bc(52,"Remember me"),l.Ob(),l.Ob(),l.Ob(),l.Pb(53,"div",37),l.Pb(54,"button",38),l.Bc(55,"Sign in"),l.Ob(),l.Ob(),l.Ob(),l.Ob(),l.Ob(),l.Pb(56,"div",39),l.Pb(57,"div",40),l.Pb(58,"a",41),l.Pb(59,"small"),l.Bc(60,"Forgot password?"),l.Ob(),l.Ob(),l.Ob(),l.Pb(61,"div",42),l.Pb(62,"a",41),l.Pb(63,"small"),l.Bc(64,"Create new account"),l.Ob(),l.Ob(),l.Ob(),l.Ob(),l.Ob(),l.Ob(),l.Ob())},directives:[p.h,p.d,p.e],styles:[""]}),r)},{path:"register",component:(i=function(){function e(){t(this,e)}return b(e,[{key:"ngOnInit",value:function(){}}]),e}(),i.\u0275fac=function(t){return new(t||i)},i.\u0275cmp=l.Eb({type:i,selectors:[["app-register"]],decls:71,vars:0,consts:[[1,"header","bg-gradient-image","py-7","py-lg-8"],[1,"container"],[1,"header-body","text-center","mb-7"],[1,"row","justify-content-center"],[1,"col-lg-5","col-md-6"],[1,"text-white"],[1,"text-lead","text-light"],[1,"separator","separator-bottom","separator-skew","zindex-100"],["x","0","y","0","viewBox","0 0 2560 100","preserveAspectRatio","none","version","1.1","xmlns","http://www.w3.org/2000/svg"],["points","2560 0 2560 100 0 100",1,"fill-default"],[1,"container","mt--8","pb-5"],[1,"col-lg-6","col-md-8"],[1,"card","bg-secondary","shadow","border-0"],[1,"card-header","bg-transparent","pb-5"],[1,"text-muted","text-center","mt-2","mb-4"],[1,"text-center"],["href","javascript:void(0)",1,"btn","btn-neutral","btn-icon","mr-4"],[1,"btn-inner--icon"],["src","assets/img/icons/common/github.svg"],[1,"btn-inner--text"],["href","javascript:void(0)",1,"btn","btn-neutral","btn-icon"],["src","assets/img/icons/common/google.svg"],[1,"card-body","px-lg-5","py-lg-5"],[1,"text-center","text-muted","mb-4"],["role","form"],[1,"form-group"],[1,"input-group","input-group-alternative","mb-3"],[1,"input-group-prepend"],[1,"input-group-text"],[1,"ni","ni-hat-3"],["placeholder","Name","type","text",1,"form-control"],[1,"ni","ni-email-83"],["placeholder","Email","type","email",1,"form-control"],[1,"input-group","input-group-alternative"],[1,"ni","ni-lock-circle-open"],["placeholder","Password","type","password",1,"form-control"],[1,"text-muted","font-italic"],[1,"text-success","font-weight-700"],[1,"row","my-4"],[1,"col-12"],[1,"custom-control","custom-control-alternative","custom-checkbox"],["id","customCheckRegister","type","checkbox",1,"custom-control-input"],["for","customCheckRegister",1,"custom-control-label"],[1,"text-muted"],["href","#!"],["type","button",1,"btn","btn-primary","mt-4"]],template:function(t,e){1&t&&(l.Pb(0,"div",0),l.Pb(1,"div",1),l.Pb(2,"div",2),l.Pb(3,"div",3),l.Pb(4,"div",4),l.Pb(5,"h1",5),l.Bc(6,"Welcome!"),l.Ob(),l.Pb(7,"p",6),l.Bc(8," Use these awesome forms to login or create new account in your project for free. "),l.Ob(),l.Ob(),l.Ob(),l.Ob(),l.Ob(),l.Pb(9,"div",7),l.dc(),l.Pb(10,"svg",8),l.Lb(11,"polygon",9),l.Ob(),l.Ob(),l.Ob(),l.cc(),l.Pb(12,"div",10),l.Pb(13,"div",3),l.Pb(14,"div",11),l.Pb(15,"div",12),l.Pb(16,"div",13),l.Pb(17,"div",14),l.Pb(18,"small"),l.Bc(19,"Sign up with"),l.Ob(),l.Ob(),l.Pb(20,"div",15),l.Pb(21,"a",16),l.Pb(22,"span",17),l.Lb(23,"img",18),l.Ob(),l.Pb(24,"span",19),l.Bc(25,"Github"),l.Ob(),l.Ob(),l.Pb(26,"a",20),l.Pb(27,"span",17),l.Lb(28,"img",21),l.Ob(),l.Pb(29,"span",19),l.Bc(30,"Google"),l.Ob(),l.Ob(),l.Ob(),l.Ob(),l.Pb(31,"div",22),l.Pb(32,"div",23),l.Pb(33,"small"),l.Bc(34,"Or sign up with credentials"),l.Ob(),l.Ob(),l.Pb(35,"form",24),l.Pb(36,"div",25),l.Pb(37,"div",26),l.Pb(38,"div",27),l.Pb(39,"span",28),l.Lb(40,"i",29),l.Ob(),l.Ob(),l.Lb(41,"input",30),l.Ob(),l.Ob(),l.Pb(42,"div",25),l.Pb(43,"div",26),l.Pb(44,"div",27),l.Pb(45,"span",28),l.Lb(46,"i",31),l.Ob(),l.Ob(),l.Lb(47,"input",32),l.Ob(),l.Ob(),l.Pb(48,"div",25),l.Pb(49,"div",33),l.Pb(50,"div",27),l.Pb(51,"span",28),l.Lb(52,"i",34),l.Ob(),l.Ob(),l.Lb(53,"input",35),l.Ob(),l.Ob(),l.Pb(54,"div",36),l.Pb(55,"small"),l.Bc(56,"password strength: "),l.Pb(57,"span",37),l.Bc(58,"strong"),l.Ob(),l.Ob(),l.Ob(),l.Pb(59,"div",38),l.Pb(60,"div",39),l.Pb(61,"div",40),l.Lb(62,"input",41),l.Pb(63,"label",42),l.Pb(64,"span",43),l.Bc(65,"I agree with the "),l.Pb(66,"a",44),l.Bc(67,"Privacy Policy"),l.Ob(),l.Ob(),l.Ob(),l.Ob(),l.Ob(),l.Ob(),l.Pb(68,"div",15),l.Pb(69,"button",45),l.Bc(70,"Create account"),l.Ob(),l.Ob(),l.Ob(),l.Ob(),l.Ob(),l.Ob(),l.Ob(),l.Ob())},directives:[p.h,p.d,p.e],styles:[""]}),i)}],u=((c=function e(){t(this,e)}).\u0275mod=l.Ib({type:c}),c.\u0275inj=l.Hb({factory:function(t){return new(t||c)},imports:[[s.b,a.e.forChild(d),p.a]]}),c)}}])}();