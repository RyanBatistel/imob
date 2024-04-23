const SQLite3 = require("sqlite3");

module.exports = app => {
    
    const db = new SQLite3.Database('imob', SQLite3.OPEN_READWRITE, function(erro){
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

    // Inserir um novo imóvel com endereço
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
                        else
                            return res.status(201).send("Imóvel inserido com sucesso!");
                    });
            });
    });

    // Atualizar um imóvel
    app.put('/imovel/:id', function(req, res){
        let reg = req.body;

        // Atualiza o endereço na tabela 'endereco'
        db.run("UPDATE endereco SET cidade = ?, bairro = ?, estado = ?, logradouro = ?, cep = ?, numero = ? WHERE id_endereco = (SELECT endereco_id_endereco FROM imovel WHERE id_imovel = ?)",
            [reg.endereco.cidade, reg.endereco.bairro, reg.endereco.estado, reg.endereco.logradouro, reg.endereco.cep, reg.endereco.numero, req.params.id],
            function(erro) {
                if (erro)
                    return res.status(500).send("Erro ao atualizar endereço: " + erro.message);
                
                // Atualiza o imóvel
                db.run("UPDATE imovel SET matricula = ?, tipo = ?, nome = ?, valor = ?, tamanho = ?, andar = ?, descricao = ? WHERE id_imovel = ?",
                    [reg.matricula, reg.tipo, reg.nome, reg.valor, reg.tamanho, reg.andar, reg.descricao, req.params.id],
                    function (erro)
                    {
                        if (erro)
                            return res.status(500).send("Erro ao atualizar imóvel: " + erro.message);
                        else
                            return res.status(200).send("Imóvel atualizado com sucesso!");
                    });
            });
    });

    // Deletar um imóvel e seu endereço associado
    app.delete('/imovel/:id', function(req, res){
        const deletaImovel = 'DELETE FROM imovel WHERE id_imovel = ?';
        const deletaEndereco = 'DELETE FROM endereco WHERE id_endereco = (SELECT endereco_id_endereco FROM imovel WHERE id_imovel = ?)';

        db.serialize(function() {
            // Exclui o endereço associado ao imóvel
            db.run(deletaEndereco, [req.params.id], function(erroEndereco) {
                if (erroEndereco)
                    return res.status(500).send("Erro ao deletar endereço: " + erroEndereco.message);

                // Exclui o imóvel
                db.run(deletaImovel, [req.params.id], function(erroImovel) {
                    if (erroImovel)
                        return res.status(500).send("Erro ao deletar imóvel: " + erroImovel.message);

                    return res.status(200).send("Imóvel e endereço deletados com sucesso!");
                });
            });
        });
    });
};
