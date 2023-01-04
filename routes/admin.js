const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
require('../models/Categoria.js')
require('../models/Postagem.JS')
const Categoria = mongoose.model('categorias')
const Postagem = mongoose.model('postagens')
const {eAdmin}=  require("../helpers/eAdmin")

router.get('/', eAdmin, (req, res) => {
    res.render("admin/index.handlebars")
})

router.get('/posts', eAdmin, (req, res) =>{
    res.send('Página de posts')
})

router.get('/categorias', eAdmin, async (req, res, next) => {
    try {
      const categorias = await Categoria.find().sort({date:'desc'});
  
  
  //listar em json    
  //return res.send({categorias})
  
  
      return res.render("admin/categorias.handlebars", {categorias: categorias.map(categorias => categorias.toJSON())})
    } catch (err) {
      req.flash("error_msg", "Houve um erro ao carregar as categorias")
      res.redirect('/')
    }
  })
router.get('/categorias/add', eAdmin, (req, res) =>{
    res.render("admin/addcategorias.handlebars")
})

router.post('/categorias/nova', eAdmin,(req, res) => {

    var erros = [];

    if(!req.body.nome || typeof req.body.nome == undefined || req.body.nome == null ){
        erros.push({texto: "Nome inválido"})
    }

    if(!req.body.slug || typeof req.body.slug == undefined || req.body.slug == null){
        erros.push({texto: "Slug inválido"})
    }
    if(req.body.nome.length < 2 || req.body.slug.length < 2){
        erros.push({texto: "Nome da categoria é muito pequeno"})
    }

    if(erros.length > 0){
        res.render("admin/addcategorias.handlebars", {erros: erros})
    } else{

        const novaCategoria = {
            nome: req.body.nome,
            slug: req.body.slug
        };
    
        new Categoria(novaCategoria).save().then(()=> {
            req.flash('success_msg', 'Categoria criada com sucesso')
            res.redirect('/admin/categorias')
        }).catch((err)=>{
            req.flash('error_msg', "Houve um erro ao salvar a categoria, tente novamente !")
            res.redirect('/admin')
        })
    }

})

router.get("/categorias/edit/:id", eAdmin, (req, res) =>{
    Categoria.findOne({ _id: req.params.id }).lean().then((categoria) => {
        res.render('admin/editcategorias.handlebars', {categoria: categoria})
    }).catch((err) =>{
        req.flash("error_msg", "Esta categoria não existe")
        res.redirect("/admin/categorias")
    })
})

router.get("/postagens/edit/:id", eAdmin, (req, res) =>{
    Postagem.findOne({_id: req.params.id}).lean().then((postagem) => {
        
        Categoria.find().lean().then((categorias) =>{
            res.render("admin/editpostagens.handlebars", {categorias: categorias, 
                postagem: postagem})

        }).catch((err) =>{
            req.flash('error_msg', 'Houve um erro ao listar as categorias')
            res.redirect('/admin/postagens')
        })
    }).catch((err) =>{
        req.flash('error_msg', "Houve um erro ao carregar o formulário de edição")
        res.redirect("/admin/postagens")
    })
       
})

 
router.post("/categorias/edit",eAdmin, (req, res) => {
    Categoria.findOne({ _id: req.body.id }).then((categoria) => {
        let erros = []

        if (!req.body.nome || typeof req.body.nome == undefined || req.body.nome == null) {
            erros.push({ texto: "Nome invalido" })
        }
        if (!req.body.slug || typeof req.body.slug == undefined || req.body.slug == null) {
            erros.push({ texto: "Slug invalido" })
        }
        if (req.body.nome.length < 2) {
            erros.push({ texto: "Nome da categoria muito pequeno" })
        }
        if (erros.length > 0) {
            Categoria.findOne({ _id: req.body.id }).lean().then((categoria) => {
                res.render("admin/editcategorias", { categoria: categoria})
            }).catch((err) => {
                req.flash("error_msg", "Erro ao pegar os dados")
                res.redirect("admin/categorias")
            })
            
        } else {


            categoria.nome = req.body.nome
            categoria.slug = req.body.slug

            categoria.save().then(() => {
                req.flash("success_msg", "Categoria editada com sucesso!")
                res.redirect("/admin/categorias")
            }).catch((err) => {
                req.flash("error_msg", "Erro ao salvar a edição da categoria")
                res.redirect("admin/categorias")
            })

        }
    }).catch((err) => {
        req.flash("error_msg", "Erro ao editar a categoria")
        req.redirect("/admin/categorias")
    })
})

router.post("/postagem/edit", eAdmin, (req, res) => {
    Postagem.findOne({ _id: req.body.id }).then((postagem) => {


            postagem.titulo = req.body.titulo
            postagem.slug = req.body.slug
            postagem.descricao = req.body.descricao
            postagem.conteudo = req.body.conteudo
            postagem.categoria = req.body.categoria


            postagem.save().then(() => {
                req.flash("success_msg", "Postagem editada com sucesso!")
                res.redirect("/admin/postagens")
            }).catch((err) => {
                req.flash("error_msg", "Erro ao salvar a edição da postagem")
                res.redirect("admin/postagens")
            })
            
    }).catch((err) => {
        console.log(err)
        req.flash("error_msg", "Erro ao salvar a edição")
        res.redirect("/admin/postagens")
    })
})


router.post('/categorias/excluir', eAdmin, (req, res) =>{
    Categoria.remove({_id: req.body.id}).then(() =>{
        req.flash("success_msg", 'Categoria deletada com sucesso')
        res.redirect('/admin/categorias')
    }).catch((err) =>{
        req.flash("error_msg", 'Erro ao deletar a categoria')
        res.redirect('/admin/categorias')
    })
})

router.get('/postagens',eAdmin, (req, res) => {
    
    Postagem.find().lean().populate('categoria').sort({data: 'desc'}).then((postagens) => {

        res.render('admin/postagens.handlebars', {postagens: postagens})

    }).catch( (err) => {

        req.flash('error_msg', 'Erro ao listar os posts')
        res.render('/admin')

    })
    

})

router.get('/postagens/add', eAdmin,(req, res) => {
    Categoria.find().lean().then((categorias) => {
        res.render("admin/addpostagem.handlebars", {categorias: categorias})
    }).catch((err) => {
        req.flash("error_msg", "Houve um erro ao carregar o formulário")
        res.redirect("/admin")
    })
})

router.post("/postagens/nova", eAdmin,(req, res) => {
    var erros = []

        if(req.body.categoria == "0"){
            erros.push({texto: "Categoria inválida, registre uma categoria"})
        }
        
        if (erros.length > 0) {
            res.render("admin/addpostagem.handlebars", {erros: erros})
        } else {
            const novaPostagem = {
                titulo: req.body.titulo,     
                descricao: req.body.descricao,
                conteudo: req.body.conteudo,
                categoria: req.body.categoria,
                slug: req.body.slug
            }
            new Postagem(novaPostagem).save().then(() =>{
                req.flash('success_msg', 'Postagem criada com sucesso!')
                res.redirect("/admin/postagens")
            }).catch((err) =>{
                req.flash('error_msg', 'Houve um erro durante o salvamento da postagem')
                res.redirect("/admin/postagens")

            })
        }
})
    router.get("/postagens/deletar/:id", eAdmin, (req, res) => {
        Postagem.remove({_id: req.params.id}).then(() =>{
            req.flash("success_msg", "Postagem deletada com sucessso !")
            res.redirect("/admin/postagens")
        }).catch((err) =>{
            req.flash("error_msg", "Houve um erro interno")
            res.redirect("/admin/postsgens")
        })
    })

    
module.exports = router
