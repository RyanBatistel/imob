const SQLite3 = require("sqlite3");

module.exports = app => {
    
    const db = new SQLite3.Database('imob.db', SQLite3.OPEN_READWRITE, function(erro){
        if(erro)
            return console.log("Houve erro de conexão: " + erro.message)
    });

    // Selecionar todos os imóveis
    app.get('/imovel', (req, res) => {
        db.all("SELECT * FROM imovel", [], function(erro, linhas){
            if(erro)
                return res.status(500).send("Ocorreu um erro na consulta: " + erro.message);
            else    
                return res.status(200).json(linhas);
        });
    });

    // Inserir um novo imóvel com endereço e imagens e dependencias
    app.post('/imovel', function(req, res) {
        let reg = req.body;

        // Insere o endereço na tabela 'endereco'
        db.run("INSERT INTO endereco (cidade, bairro, estado, logradouro, cep, numero) VALUES (?, ?, ?, ?, ?, ?)",
            [reg.endereco.cidade, reg.endereco.bairro, reg.endereco.estado, reg.endereco.logradouro, reg.endereco.cep, reg.endereco.numero],
            function(erro) {
                if (erro)
                    return res.status(500).send("Erro ao inserir endereço: " + erro.message);
                
                const enderecoId = this.lastID;

                // Insere o imóvel com o ID do endereço inserido
                db.run("INSERT INTO imovel (matricula, tipo, nome, valor, tamanho, andar, descricao, endereco_id_endereco) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                    [reg.matricula, reg.tipo, reg.nome, reg.valor, reg.tamanho, reg.andar, reg.descricao, enderecoId],
                    function (erro)
                    {
                        if (erro)
                            return res.status(500).send("Erro ao inserir imóvel: " + erro.message);
                        
                        const imovelId = this.lastID;

                        // Insere as imagens associadas ao imóvel
                        if (reg.imagens && reg.imagens.length > 0) {
                            reg.imagens.forEach(function(imagem) {
                                db.run("INSERT INTO imagem (url, nome, imovel_id_imovel) VALUES (?, ?, ?)",
                                    [imagem.url, imagem.nome, imovelId],
                                    function(erro) {
                                        if (erro)
                                            console.log("Erro ao inserir imagem: " + erro.message);
                                    });
                            });
                        }

                        // Insere as dependencias associadas ao imóvel
                        if (reg.dependencia && reg.dependencia.length > 0) {
                            reg.dependencia.forEach(function(dependencia) {
                                db.run("INSERT INTO dependencia (descricao, quantidade, imovel_id_imovel) VALUES (?, ?, ?)",
                                    [dependencia.descricao, dependencia.quantidade, imovelId],
                                    function(erro) {
                                        if (erro)
                                            console.log("Erro ao inserir dependencia: " + erro.message);
                                    });
                            });
                        }

                        return res.status(201).send("Imóvel inserido com sucesso!");
                    });
            });
    });

    // Atualizar um imóvel
    
    // Atualizar um imóvel
app.put('/imovel/:id', function(req, res){
    let reg = req.body;

    // Verifica se todos os campos necessários estão presentes no corpo da solicitação
    if (!reg.endereco || !reg.imovel || !reg.dependencia || !reg.imagem) {
        return res.status(400).send("Corpo da solicitação incompleto");
    }

    db.run("UPDATE endereco SET cidade = ?, bairro = ?, estado = ?, logradouro = ?, cep = ?, numero = ? WHERE id_endereco = (SELECT endereco_id_endereco FROM imovel WHERE id_imovel = ?)",
        [reg.endereco.cidade, reg.endereco.bairro, reg.endereco.estado, reg.endereco.logradouro, reg.endereco.cep, reg.endereco.numero, req.params.id],
        function(erro) {
            if (erro)
                return res.status(500).send("Erro ao atualizar endereço: " + erro.message);
            
            db.run("UPDATE imovel SET matricula = ?, tipo = ?, nome = ?, valor = ?, tamanho = ?, andar = ?, descricao = ? WHERE id_imovel = ?",
                [reg.imovel.matricula, reg.imovel.tipo, reg.imovel.nome, reg.imovel.valor, reg.imovel.tamanho, reg.imovel.andar, reg.imovel.descricao, req.params.id],
                function (erro) {
                    if (erro)
                        return res.status(500).send("Erro ao atualizar imóvel: " + erro.message);

                    // Atualiza as dependências
                    if (reg.dependencia && reg.dependencia.length > 0) {
                        reg.dependencia.forEach(function(dependencia) {
                            db.run("UPDATE dependencia SET descricao = ?, quantidade = ? WHERE imovel_id_imovel = ?",
                                [dependencia.descricao, dependencia.quantidade, req.params.id],
                                function(erro) {
                                    if (erro)
                                        console.log("Erro ao atualizar dependencia: " + erro.message);
                                });
                        });
                    }

                    // Atualiza as imagens
                    if (reg.imagem && reg.imagem.length > 0) {
                        reg.imagem.forEach(function(imagem) {
                            db.run("UPDATE imagem SET url = ?, nome = ? WHERE imovel_id_imovel = ?",
                                [imagem.url, imagem.nome, req.params.id],
                                function(erro) {
                                    if (erro)
                                        console.log("Erro ao atualizar imagem: " + erro.message);
                                });
                        });
                    }

                    return res.status(200).send("Imóvel atualizado com sucesso!");
                });
        });
});

    
    

    // Deletar um imóvel e seu endereço associado
    app.delete('/imovel/:id', function(req, res){
        const deletaImovel = 'DELETE FROM imovel WHERE id_imovel = ?';
        const deletaEndereco = 'DELETE FROM endereco WHERE id_endereco = (SELECT endereco_id_endereco FROM imovel WHERE id_imovel = ?)';
        const deletaImagens = 'DELETE FROM imagem WHERE imovel_id_imovel = ?';
        const deletaDependencias = 'DELETE FROM dependencia WHERE imovel_id_imovel = ?';

        db.serialize(function() {
            // Exclui as imagens associadas ao imóvel
            db.run(deletaImagens, [req.params.id], function(erroImagens) {
                if (erroImagens)
                    return res.status(500).send("Erro ao deletar imagens: " + erroImagens.message);

                // Exclui as dependencias associadas ao imóvel
                db.run(deletaDependencias, [req.params.id], function(erroDependencias) {
                    if (erroDependencias)
                        return res.status(500).send("Erro ao deletar dependencias: " + erroDependencias.message);

                    // Exclui o endereço associado ao imóvel
                    db.run(deletaEndereco, [req.params.id], function(erroEndereco) {
                        if (erroEndereco)
                            return res.status(500).send("Erro ao deletar endereço: " + erroEndereco.message);

                        // Exclui o imóvel
                        db.run(deletaImovel, [req.params.id], function(erroImovel) {
                            if (erroImovel)
                                return res.status(500).send("Erro ao deletar imóvel: " + erroImovel.message);

                            return res.status(200).send("Imóvel, endereço, imagens e dependencias deletados com sucesso!");
                        });
                    });
                });
            });
        });
    });
};
