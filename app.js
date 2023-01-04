//Carregando módulos

const express = require('express')
const handlebars = require('express-handlebars')
const bodyParser = require('body-parser')
const app = express()
const admin = require('./routes/admin')
const path = require('path')
const exp = require('constants')
const mongoose = require('mongoose')
const session = require('express-session')
const flash = require ('connect-flash')
require("../blogapp/models/Postagem")
require("../blogapp/models/Categoria")
const Categoria = mongoose.model('categorias')
const Postagem = mongoose.model('postagens')
const usuarios = require("./routes/usuario")
const passport = require("passport")
require("./config/auth")(passport)

//Configurações
    //Sessão
        app.use(session({
            secret: "cursodenode",
            resave: true,
            saveUninitialized: true
        }))

        app.use(passport.initialize())
        app.use(passport.session())

        app.use(flash())
    //Middleware
    app.use((req, res, next) => {
        res.locals.success_msg = req.flash("success_msg")
        res.locals.error_msg = req.flash("error_msg")
        res.locals.error = req.flash("error")
        res.locals.user = req.user || null;
        next()
    })
    // Body Parser
    app.use(express.urlencoded({extended: true}));
    app.use(express.json())

    // Handlebars
    app.engine('handlebars', handlebars.engine({defaultLayout: 'main'}))
    app.set('View engine', 'handlebars')

    //Mongoose
    mongoose.set("strictQuery", true);
    mongoose.connect('mongodb://127.0.0.1:27017/blogapp').then(() =>{
        console.log("Conectado com sucesso")
    }).catch((err) =>{
        console.log("Erro ao se conectar ao servidor: " + err)
    });

    // Public
    app.use(express.static(path.join(__dirname, "public")))

//Rotas
app.get('/', (req, res) => {
    Postagem.find().lean().populate("categoria").sort({data: 'desc'}).then((postagens) => {
        res.render("index.handlebars", {postagens: postagens})
    }).catch((err) => {
        console.log(err)
        req.flash("error_msg", "Não foi possível carregar os posts")
        res.redirect("/404")
    })
})

app.get("/404", (req, res) =>{
    res.send("Erro 404")
})

app.get("/postagem/:slug", (req, res) => {
    Postagem.findOne({slug: req.params.slug}).lean().then((postagem) => {
        if(postagem){
            res.render("postagem/index.handlebars", {postagem: postagem})
        }else{
            req.flash("error_msg", "Essa postagem não existe")
            res.redirect("/")
        }
    }).catch((err) => {
        console.log(err)
        req.flash("error_msg", "Houve um erro interno")
        res.redirect("/")
    })
})

    app.get("/categorias", (req, res) =>{
        Categoria.find().lean().then((categorias) =>{
                res.render("categorias/index.handlebars", {categorias: categorias})
        }).catch((err) =>{
            req.flash('msg_error', "Houve um erro interno ao listar as categorias")
            res.redirect("/")
        })
    })
    app.get("/categorias/:slug", (req, res) =>{
        Categoria.findOne({slug: req.params.slug}).lean().then((categoria) => {
            if (categoria) {
                Postagem.find({categoria: categoria._id}).then((postagens) =>{

                    res.render('categorias/postagens.handlebars', {postagens:  postagens.map(Categoria=> Categoria.toJSON())})

                }).catch((err) =>{
                    req.flash('error_msg', "Houve um erro ao listar os posts!")
                    res.redirect('/')
                })
            } else{
                req.flash('error_msg', 'Esta categoria não existe')
                res.redirect('/')
            }
        }).catch((err) =>{
            req.flash('error_msg', "Houve um erro interno ao carregar a página desta categoria")
            res.redirect('/')
        })
    })

    app.use('/admin', admin)
    app.use('/usuarios', usuarios);
//Outros
const PORT = process.env.Port ||8081
app.listen(PORT, () =>{
    console.log("Servidor rodando na porta "+ PORT)
})