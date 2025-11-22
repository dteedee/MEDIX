# Gerenciamento de Promoções - MEDIX

## Visão Geral
Página completa de gerenciamento de promoções para managers, com interface moderna e funcionalidades CRUD completas.

## Funcionalidades Implementadas

### 📊 Dashboard de Estatísticas
- **Total de promoções**: Contador total de promoções cadastradas
- **Promoções ativas**: Número de promoções atualmente ativas
- **Promoções inativas**: Número de promoções desativadas
- **Total de usos**: Soma total de vezes que as promoções foram utilizadas

### 🔍 Filtros e Busca
- **Busca em tempo real**: Por nome ou código da promoção
- **Filtro por status**: Todas, Ativas ou Inativas
- **Filtro por tipo**: Todas, Percentual ou Valor Fixo
- **Ordenação**: Por código, nome, tipo, valor, uso, data de início/fim
- **Paginação**: Configurável (5, 10, 15, 20 itens por página)

### 📝 CRUD Completo

#### Criar Promoção
- Código da promoção (validação de caracteres únicos)
- Nome descritivo
- Descrição opcional
- Tipo de desconto: Percentual ou Valor Fixo
- Valor do desconto
- Limite de uso (opcional)
- Data de início e fim
- Status ativo/inativo

#### Visualizar Promoção
- Todos os campos em modo somente leitura
- Informações adicionais:
  - Número de vezes utilizada
  - Taxa de utilização (usado/máximo)
  - Data de criação
  - Status atual detalhado

#### Editar Promoção
- Todos os campos editáveis (exceto o código)
- **Código bloqueado**: Não pode ser alterado após criação
- Validação completa de dados
- Aviso visual quando campo está bloqueado

#### Excluir Promoção
- Confirmação antes da exclusão
- Exclusão permanente

#### Ativar/Desativar
- Toggle rápido de status
- Atualização em tempo real

### 🎨 Interface do Usuário

#### Indicadores Visuais
- **Badge de Status**: Verde (ativo) / Vermelho (inativo)
- **Badge de Tipo**: Azul (percentual) / Laranja (fixo)
- **Ícones de Estado no Código**:
  - ✅ Verde: Promoção válida e ativa
  - ❌ Vermelho: Inativa
  - 🕐 Laranja: Expirada
  - ⏳ Cinza: Ainda não iniciada
  - ⚠️ Laranja: Limite atingido

#### Tabela Responsiva
- Design moderno com gradiente no header
- Hover effects
- Ações rápidas por linha
- Informações formatadas (datas, valores)

#### Modais
- Modal de visualização
- Modal de criação
- Modal de edição
- Dialog de confirmação para exclusão

### 🔐 Validações

#### Frontend
- **Código**: 
  - Apenas letras, números, hífen e underscore
  - **Bloqueado durante edição** (não pode ser alterado)
  - Obrigatório na criação
- Nome: Obrigatório
- Valor: Maior que 0, máximo 100% para percentual
- Datas: Data fim posterior à data início
- Limite de uso: Mínimo 1 se informado

#### Backend
- Verificação de código duplicado
- Validação de model state
- Tratamento de erros específicos (409 Conflict)

### 🛣️ Rotas

**Frontend**:
- `/app/manager/promotions` - Página de gerenciamento

**Backend APIs**:
- `GET /api/promotion/getAll` - Listar todas
- `GET /api/promotion/code/{code}` - Buscar por código
- `POST /api/promotion` - Criar nova
- `PUT /api/promotion/{id}` - Atualizar
- `DELETE /api/promotion/{id}` - Excluir

### 🎯 Integração Backend

O sistema está integrado com as seguintes APIs do backend:

```csharp
// Endpoints utilizados
[HttpGet("getAll")] - getAllPromotion()
[HttpGet("code/{code}")] - GetPromotionByCodeAsync()
[HttpPost] - CreatePromotion()
[HttpPut("{id:guid}")] - UpdatePromotion()
[HttpDelete("{id}")] - DeletePromotion()
```

### 📱 Responsividade
- Layout adaptável para desktop, tablet e mobile
- Sidebar colapsável
- Tabela com scroll horizontal em telas pequenas

### 🎨 Temas e Cores
- Primário: #667eea (roxo)
- Secundário: #764ba2 (roxo escuro)
- Sucesso: #48bb78 (verde)
- Erro: #f56565 (vermelho)
- Aviso: #ed8936 (laranja)
- Info: #4299e1 (azul)

### 📦 Estrutura de Arquivos

```
src/
├── pages/manager/
│   └── PromotionManagement.tsx          # Componente principal
├── styles/manager/
│   └── PromotionManagement.module.css   # Estilos CSS Modules
├── services/
│   └── promotionService.ts              # Serviço de API
├── types/
│   └── promotion.types.ts               # Definições TypeScript
└── components/layout/
    ├── ManagerSidebar.tsx               # Item de menu adicionado
    └── ManagerLayout.tsx                # Rota configurada
```

### 🚀 Como Usar

1. **Acesso**: Login como Manager ou Admin
2. **Navegar**: Menu lateral > "Khuyến mãi"
3. **Criar**: Botão "Tạo mới" no canto superior direito
4. **Gerenciar**: Use os ícones de ação em cada linha da tabela
5. **Filtrar**: Use a barra de busca e filtros avançados

### 🔧 Tecnologias Utilizadas
- React + TypeScript
- CSS Modules
- React Router
- Axios (via apiClient)
- Context API (Toast, Auth)

### ✅ Checklist de Recursos
- [x] Listagem com paginação
- [x] Criação de promoção
- [x] Edição de promoção
- [x] Visualização de promoção
- [x] Exclusão de promoção
- [x] Ativação/Desativação
- [x] Busca em tempo real
- [x] Filtros avançados
- [x] Ordenação de colunas
- [x] Validação de dados
- [x] Mensagens de erro
- [x] Confirmação de ações
- [x] Design responsivo
- [x] Indicadores visuais
- [x] Integração com backend
- [x] Tratamento de erros

### 📝 Notas Importantes

1. **Autorização**: Todas as APIs requerem token de autenticação
2. **Roles**: Manager e Admin têm acesso
3. **Validação**: Códigos duplicados são bloqueados pelo backend
4. **Estado**: O localStorage mantém os filtros entre sessões
5. **Performance**: A lista é carregada uma vez e filtrada no frontend
6. **isActive**: O backend retorna 0 (inativo) ou 1 (ativo), normalizado automaticamente para boolean no frontend

---

**Desenvolvido para**: Sistema MEDIX
**Data**: Novembro 2024
**Versão**: 1.0.0

