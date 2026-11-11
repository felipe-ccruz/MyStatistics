# Pixel art no front

> **Status:** proposta em discussão. A seção 1 descreve o que já existe no modelo ([MyStatistics Dashboard.html](../MyStatistics%20Dashboard.html)); da seção 2 em diante é a arquitetura proposta para o `apps/web`. As decisões em aberto estão na seção 4.

## Princípio

**Pixel art é dado, não imagem.** Um sprite é uma grade pequena de caracteres + uma paleta. O navegador desenha essa grade em SVG, em qualquer tamanho, sem baixar nenhum arquivo de imagem. Peso por ícone: algumas centenas de bytes de texto no bundle JS, comprimidos pelo gzip.

Por que não PNG solto: o peso de PNG em pixel art quase sempre vem de exportar a imagem já ampliada (um ícone 10×10 salvo em 512×512). Mesmo exportado em 1×, cada PNG é uma requisição, não muda de cor com o tema e fica borrado se o CSS esquecer `image-rendering: pixelated`.

---

## 1. Como o modelo faz (referência)

### 1.1 Formato do sprite

Cada linha é uma string; cada caractere é um pixel.

```ts
flame: [
  '....#.....',
  '....##....',
  '...###....',
  '...####.#.',
  '..#####.##',
  '.###+#####',
  '.##+++####',
  '##+++++###',
  '.#+++++##.',
  '..######..',
],
```

- `.` → transparente.
- **Ícones monocromáticos** (10×10): `#` → `currentColor` com opacidade 1; `+` → `currentColor` com opacidade 0.4 (brilho/sombra). A cor vem do CSS do elemento pai.
- **Sprites coloridos** (avatar 32×32): cada letra é uma chave da paleta. A paleta mistura cores fixas (pele `#f0d2b8`) e variáveis de tema (`var(--acc)`, `var(--av-coat)`), então o avatar troca de roupa junto com o tema.

Ícones existentes no modelo: `book`, `apple`, `dumbbell`, `flame`, `heart`, `bolt`, `mood`, `crystal`, `potion`, `check`, `plus`, `excl`, `x`.

### 1.2 Renderização (`pix`)

1. Percorre cada linha e junta pixels vizinhos iguais num retângulo só (*run-length*): `'..####..'` vira 1 `<rect width="4">`, não 4.
2. Cada `<rect>` ganha 0.02 de sobra em cada lado (`x - 0.02`, `width + 0.04`). Isso evita a linha fina entre pixels que aparece com zoom fracionário.
3. O `<svg>` tem `viewBox` igual ao tamanho da grade (`0 0 10 10`) e `shape-rendering: crispEdges`: borda dura, sem antialias. O tamanho na tela é só `width`/`height`, então o mesmo sprite serve em 10, 16 ou 26 px.
4. Cache por `nome + tamanho` (`ICO[k]`): cada ícone é montado uma vez e reaproveitado.

### 1.3 Avatar

- **Simetria:** o desenho guarda só a metade esquerda (`HALF`, 16 colunas). A direita é a mesma linha espelhada (`r + reverse(r)`), o que reduz o dado pela metade.
- **Camadas:** corpo (linhas 24–31) e cabeça (linhas 0–23) são `<g>` separados, para animar a cabeça sozinha.
- **Piscar:** retângulos extras de 2×1 nos olhos (linhas 13–15, colunas 10 e 20), com cor de pele/contorno, que aparecem por um instante cobrindo os olhos.

### 1.4 Animações

Todas usam `steps(1)`: o quadro pula em vez de deslizar. É isso que dá cara de jogo antigo.

| Elemento | Keyframe | Duração | O que faz |
| --- | --- | --- | --- |
| Cabeça do avatar | `avBob` | 1.6s | Desce 1px na metade do ciclo (respiração) |
| Olhos | `avBlink` | 4.2s | Pálpebra visível só entre 92% e 97% do ciclo |
| Chama do streak | `flick` | 0.9s | `scale(1.06, .94)` com origem na base + `drop-shadow` na cor `--flame` |
| Toast | `toastIn` | — | Entra de cima, fica, some subindo |
| Barra de XP | `transition: width .6s steps(12)` | 0.6s | Enche em 12 degraus, não contínuo |

### 1.5 Detalhes de UI sem imagem

- **Barra de XP segmentada:** `repeating-linear-gradient(90deg, transparent 0 6px, rgba(0,0,0,.35) 6px 8px)` sobre a cor de destaque. Os "blocos" são só gradiente.
- **Moldura de canto** (o card do avatar): 4 `div`s de 14×14 px, cada um com duas bordas de 2px na cor `--acc`.
- **Brilho:** `box-shadow` e `filter: drop-shadow(...)` com as variáveis `--glow`, `--glow2`, `--tglow`.
- **Fontes:** títulos em `Pixelify Sans` ou `Silkscreen` (variável `--title`), números em `JetBrains Mono` com `tabular-nums`, texto corrido em `Inter`.

### 1.6 Temas

Dois temas trocados pelo atributo `data-dir` na raiz. Só as variáveis CSS mudam:

| Variável | Tema `a` (ciano) | Tema `b` (roxo) |
| --- | --- | --- |
| `--bg` | `#0f1419` | `#0b0712` |
| `--acc` / `--acc2` | `#2dd4bf` / `#22d3ee` | `#c084fc` / `#a855f7` |
| `--title` | `Pixelify Sans` | `Silkscreen` |
| `--r` (raio) | `6px` | `2px` |

Como os sprites usam `currentColor` e `var(--…)`, nada de pixel art precisa ser redesenhado por tema.

> O modelo ainda usa as categorias antigas (`estudo`, `academia`, `alimentacao`). No oficial, valem `study` e `exercise` (ACCEPTANCE §6).

---

## 2. Arquitetura proposta

```
apps/web/src/pixel/
├── sprite.ts            Tipos (Sprite, Palette) e a conversão grade → path
├── PixelSprite.tsx      Componente React que desenha um sprite
├── sprites/
│   ├── icons.ts         Ícones 10×10 monocromáticos
│   └── avatar.ts        Avatar (metade + paleta + camadas)
└── pixel.css            Keyframes steps(), helpers de moldura/barra
```

### 2.1 Melhoria em relação ao modelo: um `<path>` por cor

O modelo cria um `<rect>` por trecho de pixels iguais. O avatar 32×32 vira algumas centenas de elementos no DOM. Proposta: juntar todos os trechos da mesma cor num único `<path>`:

```
M4 2h6v1h-6z M3 3h8v1h-8z ...
```

Mesmo visual, **um elemento por cor** (o avatar cai para ~10 elementos). O cálculo roda uma vez por sprite (memoizado, ou até em tempo de build), não a cada render.

### 2.2 API do componente

```tsx
<PixelSprite sprite={icons.flame} size={36} className="text-[var(--flame)]" />
<PixelSprite sprite={avatar} size="100%" title="Seu avatar" />
```

- `size`: tamanho na tela. O `viewBox` vem da grade.
- `title`: quando passado, vira `role="img"` + `<title>`. Sem `title`, o sprite é decorativo (`aria-hidden`).
- Camadas animáveis (como a cabeça do avatar) saem como `<g>` com `className`, animadas pelo CSS.

### 2.3 Animação

- Só CSS, com `steps()`. Nada de JS por frame.
- Animações em loop (respiração, piscar, chama) param com `@media (prefers-reduced-motion: reduce)`.
- Sprite com vários quadros (ex.: chama em 3 frames): um `<g>` por quadro, com o mesmo keyframe e `animation-delay` escalonado, cada quadro visível só na sua fatia do ciclo.

### 2.4 Quando usar outra técnica

| Caso | Técnica | Por quê |
| --- | --- | --- |
| Ícones, avatar, badges, molduras | **SVG gerado da grade** (padrão) | Sem arquivo, troca de cor com o tema, nítido em qualquer tamanho |
| Ilustração grande e estática (fundo, cena) | **PNG em 1× + `image-rendering: pixelated`**, ampliado pelo CSS | Uma grade de 200×100 viraria muitos paths; em 1× o PNG pesa poucos KB |
| Efeitos com muitas partículas (level up, faíscas de XP) | **`<canvas>` carregado sob demanda** | Centenas de pixels se mexendo por frame não cabem no DOM |
| Texto | **Fonte pixel** | Já resolve títulos; nada de desenhar letra à mão |

**Não usar** pixel art feita com `box-shadow` (um pixel por sombra): é difícil de manter e cara de repintar.

### 2.5 Orçamento de peso

- Fontes: carregar **só o subset latin** e só os pesos usados (no máximo 2 por família), em `woff2`, com `font-display: swap`. No modelo, as 20 fontes embutidas são a maior parte dos 640 KB.
- Sprites: alvo de menos de 15 KB (gzip) para todo o `pixel/`.
- Nenhuma requisição de imagem para ícone.

---

## 3. Comportamento esperado

- Sprite nítido em qualquer zoom do navegador, sem linha entre pixels.
- Trocar de tema muda as cores dos sprites na hora, sem recarregar nada.
- Com "reduzir movimento" ativo no sistema, nada pisca nem balança.
- Leitor de tela anuncia só os sprites com `title`; os decorativos são ignorados.

## 4. Decisões em aberto

1. **Como os sprites são desenhados:** à mão como texto (como no modelo) ou num editor (Aseprite/Piskel) exportando PNG em 1×, convertido em grade por um script de build?
2. **Quais elementos entram:** só ícones e avatar, ou também badges/conquistas, cenas de fundo, partículas?
3. **Temas:** manter os dois temas do modelo, escolher um, ou deixar o usuário trocar?
4. **Fontes:** `Pixelify Sans` ou `Silkscreen` nos títulos (ou as duas, uma por tema)?
5. **Avatar:** fixo, ou customizável pelo usuário (cabelo, roupa, cor)? Customizável pede paleta por usuário — e entra no contrato da API.
