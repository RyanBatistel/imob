const SQLite3 = require("sqlite3");

module.exports = app => {
    
    const db = new SQLite3.Database('imob.db', SQLite3.OPEN_READWRITE, function(erro){
        if(erro)
            return console.log("Houve erro de conexão: " + erro.message)
    });

    // Função para verificar se um ID de imóvel é válido
    async function isValidImovelId(imovelId) {
        return new Promise((resolve, reject) => {
            db.get("SELECT id_imovel FROM imovel WHERE id_imovel = ?", [imovelId], function(erro, imovel) {
                if (erro)
                    reject("Erro ao verificar ID de imóvel: " + erro.message);
                if (imovel)
                    resolve(true); // O ID de imóvel é válido
                else
                    resolve(false); // O ID de imóvel não existe no banco de dados
            });
        });
    }

    // Agendar uma nova visita
    app.post('/visita', async function(req, res) {
        let reg = req.body;

        // Verifica se o cliente existe
        db.get("SELECT id_cliente FROM cliente WHERE id_cliente = ?", [reg.cliente_id_cliente], async function(erro, cliente) {
            if (erro)
                return res.status(500).send("Erro ao verificar cliente: " + erro.message);
            if (!cliente)
                return res.status(404).send("Cliente não encontrado");

            // Insere a visita na tabela 'visita'
            db.run("INSERT INTO visita (hr_inicial, hr_final, cliente_id_cliente) VALUES (?, ?, ?)",
                [reg.hr_inicial, reg.hr_final, reg.cliente_id_cliente],
                async function(erro) {
                    if (erro)
                        return res.status(500).send("Erro ao agendar visita: " + erro.message);
                    
                    const visitaId = this.lastID;

                    // Verifica se foram fornecidos imóveis para agendar visita
                    if (reg.imoveis && reg.imoveis.length > 0) {
                        // Itera sobre os imóveis fornecidos e insere na tabela 'imovel_has_visita'
                        for (const imovelId of reg.imoveis) {
                            try {
                                const isValid = await isValidImovelId(imovelId);
                                if (isValid) {
                                    db.run("INSERT INTO imovel_has_visita (imovel_id_imovel, visita_id_visita) VALUES (?, ?)",
                                        [imovelId, visitaId],
                                        function(erro) {
                                            if (erro)
                                                console.log("Erro ao associar imóvel à visita: " + erro.message);
                                        });
                                } else {
                                    console.log("ID de imóvel inválido: " + imovelId);
                                }
                            } catch (error) {
                                console.log("Erro ao verificar ID de imóvel: " + error);
                            }
                        }
                    }

                    return res.status(201).send("Visita agendada com sucesso!");
                });
        });
    });

    // Obter todas as visitas agendadas
    app.get('/visita', (req, res) => {
        db.all("SELECT * FROM visita", [], function(erro, visitas){
            if(erro)
                return res.status(500).send("Ocorreu um erro na consulta: " + erro.message);
            else    
                return res.status(200).json(visitas);
        });
    });

    // Obter todas as visitas agendadas para um cliente específico
    app.get('/visita/cliente/:id', (req, res) => {
        db.all("SELECT * FROM visita WHERE cliente_id_cliente = ?", [req.params.id], function(erro, visitas){
            if(erro)
                return res.status(500).send("Ocorreu um erro na consulta: " + erro.message);
            else    
                return res.status(200).json(visitas);
        });
    });

    // Cancelar uma visita agendada
    app.delete('/visita/:id', function(req, res){
        const deletaVisita = 'DELETE FROM visita WHERE id_visita = ?';
        const deletaImovelHasVisita = 'DELETE FROM imovel_has_visita WHERE visita_id_visita = ?';

        db.serialize(function() {
            // Exclui os registros de imóveis associados à visita
            db.run(deletaImovelHasVisita, [req.params.id], function(erroImovelHasVisita) {
                if (erroImovelHasVisita)
                    return res.status(500).send("Erro ao deletar registros de imóveis da visita: " + erroImovelHasVisita.message);

                // Exclui a visita
                db.run(deletaVisita, [req.params.id], function(erroVisita) {
                    if (erroVisita)
                        return res.status(500).send("Erro ao deletar visita: " + erroVisita.message);

                    return res.status(200).send("Visita cancelada com sucesso!");
                });
            });
        });
    });
};
