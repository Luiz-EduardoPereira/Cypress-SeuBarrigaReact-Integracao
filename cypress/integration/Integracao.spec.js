/// <reference types = "cypress" />
const token = 'Mockando o token para utilizar no teste de interface'

describe('Testes de Integração', () => {
    beforeEach(() => {
        cy.visit('/')
        cy.server()
        cy.route({
            method: 'POST',
            url: '/signin',
            response: 'fixture:Login'
        }).as('Login')
        cy.route({
            method: 'GET',
            url: '/saldo',
            response: 'fixture:SaldoInicial'
        }).as('Saldo')
        cy.get('[data-test="email"]').type('doidoviana@outlook.com')
        cy.get('[data-test="passwd"]').type('testando1234567891011121314')
        cy.get('.btn').click()
        cy.get('.toast-message').should('have.text','Bem vindo, Usuário Mockado!')
        cy.get('.toast .toast-close-button').click()
        cy.route({
            method: 'GET',
            url: '/contas',
            response: 'fixture:ContasIniciais'
        }).as('ListarContasInicial')
    })
    after(() => {
        cy.clearLocalStorage()
    })

    context('Contas', () => {
        it('Criar conta', () => {
            cy.route({
                method: 'POST',
                url: '/contas',
                response: 'fixture:NovaConta'
            }).as('ContaNova')
            cy.get('[data-test="menu-settings"]').click()
            cy.get('[href="/contas"]').should('be.visible').click()
            cy.route({
                method: 'GET',
                url: '/contas',
                response: 'fixture:ContaCriadaMaisContasInicias'
            }).as('ListarContasFinal')
            cy.get('[data-test="nome"]').type('Conta da Empresa')
            cy.get('.btn').click()
            cy.get('.toast-message').should('have.text','Conta inserida com sucesso!')
        })

        it('Tentar criar conta repetida', () => {
            cy.route({
                method: 'POST',
                url: '/contas',
                response:
                    { error: "Já existe uma conta com esse nome!" },
                     status: 400
            }).as('ContaRepetida')
            cy.get('[data-test="menu-settings"]').click()
            cy.get('[href="/contas"]').should('be.visible').click()
            cy.get('[data-test="nome"]').clear().type('Conta para Salário')
            cy.route({
                method: 'GET',
                url: '/contas',
                response: 'fixture:ContasIniciais'
            }).as('ListarContasFinal')
            cy.get('.btn').click()
            cy.get('.toast-message').should('have.text','Erro: Error: Request failed with status code 400')
        })

        it('Alterar uma conta', () => {
            cy.get('[data-test="menu-settings"]').click()
            cy.get('[href="/contas"]').should('be.visible').click()
            cy.get(':nth-child(1) > :nth-child(2) > :nth-child(1) > .far').click()
            cy.get('[data-test="nome"]').clear().type('Recebimento de Salário')
            cy.route({
                method: 'PUT',
                url: '/contas/1',
                response: [
                    { id: 3, nome: 'Recebimento de Salário', visivel:true, usuario_id: 9999999999 }
                ]
            }).as('AlterarConta')
            cy.route({
                method: 'GET',
                url: '/contas',
                response: [
                    { id: 1, nome: 'Recebimento de Salário', visivel:true, usuario_id: 9999999999 },
                    { id: 2, nome: 'Carteira de Investimentos', visivel:true, usuario_id: 9999999999 }
            ]
            }).as('ListarContasFinal')
            cy.get('.btn').click()
            cy.get('.toast-message').should('have.text','Conta atualizada com sucesso!')
        })

        it('Remover uma conta', () => {
            cy.get('[data-test="menu-settings"]').click()
            cy.get('[href="/contas"]').should('be.visible').click()
            cy.route({
                method: 'DELETE',
                url: '/contas/1',
                response: [
                    {},
            ]
            }).as('DeletarConta')
            cy.route({
                method: 'GET',
                url: '/contas',
                response: [
                    { id: 2, nome: 'Carteira de Investimentos', visivel: true, usuario_id: 9999999999 }
            ]
            }).as('ListarContasFinal')
            cy.get(':nth-child(1) > :nth-child(2) > :nth-child(2) > .far').click()
            cy.get('.toast-message').should('have.text','Conta excluída com sucesso!')
        })
    })
    context('Movimentação', () => {
        it('Criar movimentação do tipo de receita já liquidada', () => {
            cy.get('[data-test="menu-movimentacao"] > .fas').click()
            cy.route({
                method: 'POST',
                url: '/transacoes',
                response: [
                    {
                        conta: 'Carteira de Investimentos',
                        id: 1,
                        descricao: 'Rendimento Aplicado',
                        envolvido: 'Eu',
                        observacao: null,
                        tipo: 'REC',
                        data_transacao: '2023-02-01T03:00:00.000Z',
                        data_pagamento: '2023-02-28T03:00:00.000Z',
                        valor: '500.00',
                        status: true,
                        conta_id: 2,
                        usuario_id: 9999999999,
                        transferencia_id: null,
                        parcelamento_id: null
                    }
                ]
            }).as('CriarMovimentacaoReceitaLiquidada')
            cy.get('[data-test="descricao"]').type('Rendimento Aplicado')
            cy.get('[data-test="valor"]').type('500.00')
            cy.get('[data-test="envolvido"]').type('Eu')
            cy.get('[data-test="conta"]').select('Carteira de Investimentos')
            cy.get('[data-test="status"]').click()
            cy.route({
                method: 'GET',
                url: '/extrato/**',
                response: [
                    {
                        tipo: 'REC',
                        data_transacao: '2023/02/01',
                        data_pagamento: '2023/02/28',
                        descricao: 'Rendimento Aplicado',
                        valor: 500.00,
                        envolvido: 'Eu',
                        conta_id: 2,
                        status: true
                    }
                ]
            }).as('ListarMovimentacaoReceita')
            cy.get('.btn-primary').click()
            cy.get('.toast-message').should('have.text', 'Movimentação inserida com sucesso!')
        })

        it('Criar movimentação do tipo de despesa já liquidada', () => {
            cy.get('[data-test="menu-movimentacao"] > .fas').click()
            cy.route({
                method: 'POST',
                url: '/transacoes',
                response: [
                    {
                        conta: 'Conta para Salário',
                        id: 2,
                        descricao: 'Celular',
                        envolvido: 'Eu',
                        observacao: null,
                        tipo: 'DESP',
                        data_transacao: '2023-02-01T03:00:00.000Z',
                        data_pagamento: '2023-02-28T03:00:00.000Z',
                        valor: '-1200.00',
                        status: true,
                        conta_id: 1,
                        usuario_id: 9999999999,
                        transferencia_id: null,
                        parcelamento_id: null
                    }
                ]
            }).as('CriarMovimentacaoDespesaLiquidada')
            cy.get('[data-test="tipo-despesa"] > .fas').click()
            cy.get('[data-test="descricao"]').type('Celular')
            cy.get('[data-test="valor"]').type('1200')
            cy.get('[data-test="envolvido"]').type('Eu')
            cy.get('[data-test="conta"]').select('Conta para Salário')
            cy.get('[data-test="status"]').click()
            cy.route({
                method: 'GET',
                url: '/extrato/**',
                response: [
                    {
                        tipo: 'DESP',
                        data_transacao: '2023/02/01',
                        data_pagamento: '2023/02/28',
                        descricao: 'Celular',
                        valor: -1200.00,
                        envolvido: 'Eu',
                        conta_id: 1,
                        status: true
                    }
                ]
            }).as('ListarMovimentacaoDespesa')
            cy.get('.btn-primary').click()
            cy.get('.toast-message').should('have.text', 'Movimentação inserida com sucesso!')
        })

        //CENÁRIO ABAIXO NÃO FUNCIONA, PENSAR EM UMA SOLUÇÃO
        /*it('Alterar movimentação de receita liquidada', () => {
            cy.route({
                method: 'GET',
                url: '/extrato/**',
                response: [
                    {
                        tipo: 'REC',
                        data_transacao: '2023/02/01',
                        data_pagamento: '2023/02/28',
                        descricao: 'Rendimento Aplicado',
                        valor: 500.00,
                        envolvido: 'Eu',
                        conta_id: 2,
                        status: true
                    }
                ]
            }).as('ListarMovimentacaoReceita')
            cy.route({
                method: 'GET',
                url: '/transacoes/**',
                response: [
                    {
                        id: 1,
                        descricao: 'Rendimento Aplicado',
                        envolvido: 'Eu',
                        observacao: null,
                        tipo: 'REC',
                        data_transacao: '2023-02-01T03:00:00.000Z',
                        data_pagamento: '2023-02-28T03:00:00.000Z',
                        valor: 500.00,
                        status: false,
                        conta_id: 1,
                        usuario_id: 9999999999,
                        transferencia_id: null,
                        parcelamento_id: null
                    }
                ]
            }).as('VisualizaçãoNaAlteração')
            cy.get('[data-test="menu-extrato"] > .fas').click()
            cy.get('.row .col-md-1 a .fa-edit').click()
        })*/

        it('Remover movimentação do tipo receita já liquidada', () => {
            cy.route({
                method: 'GET',
                url: '/extrato/**',
                response: [
                    {
                        tipo: 'REC',
                        data_transacao: '2023/02/01',
                        data_pagamento: '2023/02/28',
                        descricao: 'Rendimento Aplicado',
                        valor: 500.00,
                        envolvido: 'Eu',
                        conta_id: 2,
                        status: true
                    },
                    {
                        tipo: 'REC',
                        data_transacao: '2023/02/01',
                        data_pagamento: '2023/02/28',
                        descricao: 'Venda do Celular',
                        valor: 2000.00,
                        envolvido: 'Eu',
                        conta_id: 1,
                        status: true
                    }
                ]
            }).as('ListarMovimentações')
            cy.get('[data-test="menu-extrato"] > .fas').click()
            cy.route({
                method: 'DELETE',
                url: '/transacoes/**',
                response: {}
            }).as('ExclusãoMovimentação')
            cy.route({
                method: 'GET',
                url: '/extrato/**',
                response: [
                    {
                        tipo: 'REC',
                        data_transacao: '2023/02/01',
                        data_pagamento: '2023/02/28',
                        descricao: 'Venda do Celular',
                        valor: 2000.00,
                        envolvido: 'Eu',
                        conta_id: 1,
                        status: true
                    }
                ]
            }).as('ListarMovimentaçõesApósExclusão')
            cy.get(".row .col-md-9 span:contains('Rendimento Aplicado')").parentsUntil('.row').get('.col-md-1 a .fa-trash-alt').first().click()
            cy.get('.toast-success > .toast-message').should('have.text', 'Movimentação removida com sucesso!')
        })

        it('Remover movimentação do tipo despesa já liquidada', () => {
            cy.route({
                method: 'GET',
                url: '/extrato/**',
                response: [
                    {
                        tipo: 'DESP',
                        data_transacao: '2023/02/01',
                        data_pagamento: '2023/02/28',
                        descricao: 'Celular',
                        valor: -1200.00,
                        envolvido: 'Eu',
                        conta_id: 1,
                        status: true
                    },
                    {
                        tipo: 'DESP',
                        data_transacao: '2023/02/01',
                        data_pagamento: '2023/02/28',
                        descricao: 'Parcela Máquina de Lavar',
                        valor: -350.00,
                        envolvido: 'Eu',
                        conta_id: 1,
                        status: true
                    },
                ]
            }).as('ListarMovimentações')
            cy.get('[data-test="menu-extrato"] > .fas').click()
            cy.route({
                method: 'DELETE',
                url: '/transacoes/**',
                response: {},
                status: 204
            }).as('ExclusãoMovimentação')
            cy.route({
                method: 'GET',
                url: '/extrato/**',
                response: [
                    {
                        tipo: 'DESP',
                        data_transacao: '2023/02/01',
                        data_pagamento: '2023/02/28',
                        descricao: 'Parcela Máquina de Lavar',
                        valor: -350.00,
                        envolvido: 'Eu',
                        conta_id: 1,
                        status: true
                    }
                ]
            }).as('ListarMovimentaçõesApósExclusão')
            cy.get(".row .col-md-9 span:contains('Parcela Máquina de Lavar')").parentsUntil('.row').get('.col-md-1 a .fa-trash-alt').first().click()
            cy.get('.toast-success > .toast-message').should('have.text', 'Movimentação removida com sucesso!')
        })
    })

    context('Interface', () => {
        it('Validar cores dos tipos diferentes de movimentações', ()  => {
            cy.route({
                method: 'GET',
                url: '/extrato/**',
                response: [
                    {
                        tipo: 'REC',
                        data_transacao: '2023/02/01',
                        data_pagamento: '2023/02/28',
                        descricao: 'Receita paga',
                        valor: 500.00,
                        envolvido: 'Eu',
                        conta_id: 2,
                        status: true
                    },
                    {
                        tipo: 'REC',
                        data_transacao: '2023/02/01',
                        data_pagamento: '2023/02/28',
                        descricao: 'Receita pendente',
                        valor: 2000.00,
                        envolvido: 'Eu',
                        conta_id: 1,
                        status: false
                    },
                    {
                        tipo: 'DESP',
                        data_transacao: '2023/02/01',
                        data_pagamento: '2023/02/28',
                        descricao: 'Despesa paga',
                        valor: -1200.00,
                        envolvido: 'Eu',
                        conta_id: 1,
                        status: true
                    },
                    {
                        tipo: 'DESP',
                        data_transacao: '2023/02/01',
                        data_pagamento: '2023/02/28',
                        descricao: 'Despesa Pendente',
                        valor: -350.00,
                        envolvido: 'Eu',
                        conta_id: 1,
                        status: false
                    },
                ]
            }).as('ListarMovimentações')
            cy.get('[data-test="menu-extrato"] > .fas').click()
            cy.get(".list-group .list-group-item .col-12 span:contains('Receita paga')").parentsUntil('.list-group').get('.list-group-item').should('have.class', 'receitaPaga')
        })

        it.only('Validando reponsividade no menu para resolução de 1920 x 1280', () => {
            cy.viewport(1920, 1280)
            cy.get('[data-test="menu-home"] > .fas').should('be.exist')
            cy.get('#navbarSupportedContent').should('be.visible')
            cy.get('.navbar-toggler').should('not.be.visible')
        })

        it.only('Validando responsividade do menu para resolução de 1536 x 960', () => {
            cy.viewport('macbook-16')
            cy.get('[data-test="menu-home"] > .fas').should('be.exist')
            cy.get('#navbarSupportedContent').should('be.visible')
            cy.get('.navbar-toggler').should('not.be.visible')
        })

        it.only('Validando responsividade do menu para resolução de 414 x 896', () => {
            cy.viewport('iphone-xr')
            cy.get('#navbarSupportedContent').should('not.be.visible')
            cy.get('.navbar-toggler').should('be.visible').click()
            cy.get('[data-test="menu-home"] > .fas').should('be.exist')
        })
    })
})