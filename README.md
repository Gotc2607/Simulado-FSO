# Simulado-FSO
Simulado com questões para treinar o conteúdo de Fundamentos de Sistemas Operacionais.

## Aplicação web

O projeto agora possui uma interface web para resolver o simulado com:
- navegação entre questões;
- feedback por questão;
- resultado final com percentual de acerto;
- revisão com gabarito e explicações.

### Arquivos principais
- index.html
- styles.css
- app.js
- simulado_so.json

### Como executar

Para evitar bloqueio de leitura do JSON no navegador, rode em um servidor local.

Opção 1 (Python):

```bash
python -m http.server 8000
```

Opção 2 (Node, com npx):

```bash
npx serve .
```

Depois, abra no navegador:
- http://localhost:8000 (ou a porta informada no terminal)
