# 💍 Save the Date - Matheus & Flávia

Landing page elegante para o casamento de Matheus e Flávia - 06 de Novembro de 2026

## 🎨 Design

- **Paleta Imperial**: Azul marinho escuro (#0A1929) e branco puro
- **Fontes**: Playfair Display, Cinzel e Montserrat
- **Estilo**: Minimalista elegante com detalhes imperiais
- **Totalmente Responsivo**

## ✨ Funcionalidades

- � **Animação de Entrada**: 3 segundos com iniciais M & F
- 📸 **Carrossel**: 15 fotos rolando infinitamente (60s)
- � **História do Casal**: 6 blocos animados no scroll
- 📝 **RSVP Inteligente**: Filtros por categoria (Convidados, Família, Madrinhas, Padrinhos)
- 💬 **Confirmação WhatsApp**: Envio direto via WhatsApp após preencher nome completo
- 🎨 **Paletas de Cores**: Sugestões visuais para convidados, padrinhos e pais
- � **Dress Code**: Requisitos obrigatórios detalhados

## 🚀 Deploy

Site hospedado no Render: [Em breve]

## 📱 Contato

WhatsApp para confirmações: (11) 93204-9040

## 📁 Estrutura de Arquivos

```
SAVE-THE-DATE/
├── index.html      # Estrutura HTML principal
├── styles.css      # Estilos e animações
├── script.js       # Funcionalidades JavaScript
└── README.md       # Este arquivo
```

## 🚀 Como Usar

### 1. Abrir o Site
Simplesmente abra o arquivo `index.html` em qualquer navegador moderno.

### 2. Personalizar Informações

#### No arquivo `index.html`:
- **Linha 18**: Altere os nomes dos noivos
- **Linha 19**: Altere a data do casamento
- **Linhas 50-80**: Atualize a lista de convidados no select
- **Linhas 320-340**: Atualize detalhes do evento (data, local, horário)

#### No arquivo `styles.css`:
- **Linhas 8-14**: Ajuste as variáveis de cores se necessário
- **Linha 9**: `--navy-blue` - cor principal
- **Linha 12**: `--off-white` - cor de fundo secundária

### 3. Adicionar Suas Fotos

Para substituir os placeholders pelas suas fotos:

1. Crie uma pasta `images/` no mesmo diretório
2. Adicione suas fotos (recomendado: 400x500px)
3. No `index.html`, substitua os placeholders por:

```html
<div class="carousel-item">
    <img src="images/foto1.jpg" alt="Descrição da foto">
</div>
```

4. No `styles.css`, descomente as linhas 258-262:

```css
.carousel-item img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}
```

## 📊 Ver Confirmações

As confirmações são salvas no localStorage do navegador. Para exportar os dados:

1. Abra o Console do navegador (F12)
2. Digite: `exportRSVPData()`
3. Um arquivo JSON será baixado com todas as confirmações

## 🎨 Paleta de Cores

| Cor | Hex | Uso |
|-----|-----|-----|
| Azul Marinho Escuro | `#0A1929` | Cor principal, textos, fundos |
| Azul Marinho Claro | `#1A2F45` | Hover states, variações |
| Branco Puro | `#FFFFFF` | Texto sobre fundos escuros |
| Off-White | `#F8F9FA` | Fundos de seções |

## �� Tecnologias Utilizadas

- **HTML5**: Estrutura semântica
- **CSS3**: Grid, Flexbox, Animações, Custom Properties
- **JavaScript ES6+**: Módulos, Arrow Functions, Template Literals
- **SVG**: Ícones e ornamentos vetoriais
- **Google Fonts**: Tipografia premium

## 📱 Responsividade

O site é totalmente responsivo com breakpoints:
- **Desktop**: > 768px
- **Tablet**: 768px - 480px
- **Mobile**: < 480px

## ⚡ Performance

- **Lazy Loading**: Imagens carregadas sob demanda
- **CSS Optimizado**: Will-change para animações suaves
- **JavaScript Eficiente**: Event delegation e debouncing
- **Fontes Otimizadas**: Preconnect para Google Fonts

## 🔒 Segurança

- Sanitização de inputs
- Proteção contra XSS
- Validação de dados no frontend
- Limitação de tamanho de mensagens

## 🌐 Compatibilidade

Testado e compatível com:
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## 📝 Próximos Passos

Para produção, considere:

1. **Backend**: Implementar servidor para salvar confirmações
2. **Banco de Dados**: Armazenar confirmações permanentemente
3. **Email**: Enviar confirmações por email
4. **Analytics**: Adicionar Google Analytics
5. **SEO**: Otimizar meta tags e Open Graph
6. **CDN**: Hospedar imagens em CDN
7. **SSL**: Certificado HTTPS

## 🤝 Contribuições

Este é um projeto pessoal para casamento. Sinta-se à vontade para usar como base para seu próprio evento!

## 📄 Licença

Uso pessoal livre. Créditos apreciados mas não obrigatórios.

## 💡 Dicas Importantes

### Para os Noivos:
1. Testem o formulário antes de enviar aos convidados
2. Baixem as confirmações regularmente
3. Façam backup dos dados
4. Testem em diferentes dispositivos

### Para Adicionar Fotos:
- Use imagens em alta qualidade
- Recomendado: 1200x1500px (proporção 4:5)
- Formato: JPG otimizado ou WebP
- Compacte as imagens antes de usar

### Para Hospedagem:
O site pode ser hospedado gratuitamente em:
- **GitHub Pages**: Ideal para sites estáticos
- **Netlify**: Deploy automático e fácil
- **Vercel**: Performance excelente
- **Firebase Hosting**: Google Cloud

## 📞 Suporte

Para dúvidas sobre personalização, consulte os comentários no código.

---

Desenvolvido com ❤️ para Matheus & Flávia

**Data do Grande Dia**: 15 de Junho de 2026
