const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '../index.html');
let content = fs.readFileSync(indexPath, 'utf-8');

const newFunction = `      /**
       * Clean Math, symbols, reactions, and fractions formatter (Unified Pure HTML + MathML & Sub/Sup)
       */
      formatMathAndFractions(text, isExplanation = false) {
        if (!text) return '';
        let res = String(text);

        // 0. Normalize broken/spaced HTML tags: < sub >, < /sub >, < sup >, < /sup >, < b >, < strong >, etc.
        res = res
          .replace(/<\\s*sub\\s*>/gi, '<sub>')
          .replace(/<\\s*\\/\\s*sub\\s*>/gi, '</sub>')
          .replace(/<\\s*sup\\s*>/gi, '<sup>')
          .replace(/<\\s*\\/\\s*sup\\s*>/gi, '</sup>')
          .replace(/<\\s*b\\s*>/gi, '<b>')
          .replace(/<\\s*\\/\\s*b\\s*>/gi, '</b>')
          .replace(/<\\s*strong\\s*>/gi, '<strong>')
          .replace(/<\\s*\\/\\s*strong\\s*>/gi, '</strong>')
          .replace(/<\\s*em\\s*>/gi, '<em>')
          .replace(/<\\s*\\/\\s*em\\s*>/gi, '</em>')
          .replace(/<\\s*i\\s*>/gi, '<i>')
          .replace(/<\\s*\\/\\s*i\\s*>/gi, '</i>')
          .replace(/<\\s*br\\s*\\/?\\s*>/gi, '<br>')
          .replace(/<\\s*\\/?\\s*(?:div|p|span)\\s*>/gi, ' ');

        // 1. Process MathML tags into clean semantic HTML with sub, sup, fractions, and symbols
        if (/<\\s*math[\\s\\S]*?<\\s*\\/\\s*math\\s*>/i.test(res)) {
          res = res.replace(/<\\s*math[\\s\\S]*?<\\s*\\/\\s*math\\s*>/gi, (mathTag) => {
            let s = mathTag.replace(/<\\/?math[^>]*>/gi, "");
            s = s.replace(/<semantics[^>]*>|<\\/semantics>|<annotation[^>]*>[\\s\\S]*?<\\/annotation>/gi, "");
            s = s.replace(/<\\/?mstyle[^>]*>/gi, "");

            s = s.replace(/<mspace[^>]*\\/?>(?:<\\/mspace>)?/gi, " ");
            s = s.replace(/⇨|&#x21E8;|&#8680;|&rArr;|\\u21E8|\\u2192|→/g, " → ");

            // Multiscripts / isotopes
            s = s.replace(/<mmultiscripts>\\s*(?:<m[inot]>)?([^<]+)(?:<\\/m[inot]>)?\\s*<mprescripts\\s*(?:\\/|>[\\s\\S]*?<\\/mprescripts>)\\s*<mn>([^<]+)<\\/mn>\\s*<mn>([^<]+)<\\/mn>\\s*<\\/mmultiscripts>/gi,
              (m, base, sub, sup) => " <sup>" + sup + "</sup><sub>" + sub + "</sub>" + base + " "
            );

            // Fractions
            let chg = true;
            while (chg) {
              chg = false;
              s = s.replace(/<mfrac>\\s*<m[a-z0-9]+>([\\s\\S]*?)<\\/m[a-z0-9]+>\\s*<m[a-z0-9]+>([\\s\\S]*?)<\\/m[a-z0-9]+>\\s*<\\/mfrac>/gi, (m, num, den) => {
                chg = true;
                const cleanNum = num.replace(/<[^>]+>/g, "").trim();
                const cleanDen = den.replace(/<[^>]+>/g, "").trim();
                return '<span class="clean-fraction"><span class="c-num">' + cleanNum + '</span><span class="c-den">' + cleanDen + '</span></span>';
              });
            }

            // msubsup / mmsubsup
            s = s.replace(/<msubsup>\\s*<m[a-z0-9]+>([\\s\\S]*?)<\\/m[a-z0-9]+>\\s*<m[a-z0-9]+>([\\s\\S]*?)<\\/m[a-z0-9]+>\\s*<m[a-z0-9]+>([\\s\\S]*?)<\\/m[a-z0-9]+>\\s*<\\/msubsup>/gi, (m, b, sub, sup) => {
              return " " + b.replace(/<[^>]+>/g, "").trim() + "<sub>" + sub.replace(/<[^>]+>/g, "").trim() + "</sub><sup>" + sup.replace(/<[^>]+>/g, "").trim() + "</sup> ";
            });

            // msup
            s = s.replace(/<msup>\\s*<m[a-z0-9]+>([\\s\\S]*?)<\\/m[a-z0-9]+>\\s*<m[a-z0-9]+>([\\s\\S]*?)<\\/m[a-z0-9]+>\\s*<\\/msup>/gi, (m, b, sup) => {
              return " " + b.replace(/<[^>]+>/g, "").trim() + "<sup>" + sup.replace(/<[^>]+>/g, "").trim() + "</sup> ";
            });

            // msub
            s = s.replace(/<msub>\\s*<m[a-z0-9]+>([\\s\\S]*?)<\\/m[a-z0-9]+>\\s*<m[a-z0-9]+>([\\s\\S]*?)<\\/m[a-z0-9]+>\\s*<\\/msub>/gi, (m, b, sub) => {
              return " " + b.replace(/<[^>]+>/g, "").trim() + "<sub>" + sub.replace(/<[^>]+>/g, "").trim() + "</sub> ";
            });

            s = s.replace(/<msqrt>\\s*<m[a-z0-9]+>([\\s\\S]*?)<\\/m[a-z0-9]+>\\s*<\\/msqrt>/gi, (m, inner) => " √(" + inner.replace(/<[^>]+>/g, "").trim() + ") ");

            s = s.replace(/<mo>(?:&#8594;|\\u2192)<\\/mo>/gi, " → ");
            s = s.replace(/<mo>(?:&#8658;|\\u21D2)<\\/mo>/gi, " ⇒ ");
            s = s.replace(/<mo>(?:&prop;|\\u221D)<\\/mo>/gi, " ∝ ");
            s = s.replace(/<mo>(?:&plusmn;|\\u00B1)<\\/mo>/gi, " ± ");
            s = s.replace(/<mo>(?:&times;|\\u00D7)<\\/mo>/gi, " × ");
            s = s.replace(/<mo>(?:&sdot;|\\u22C5)<\\/mo>/gi, " · ");
            s = s.replace(/<mo>(?:&le;|\\u2264)<\\/mo>/gi, " ≤ ");
            s = s.replace(/<mo>(?:&ge;|\\u2265)<\\/mo>/gi, " ≥ ");
            s = s.replace(/<mo>(?:&ne;|\\u2260)<\\/mo>/gi, " ≠ ");

            s = s.replace(/<m[a-z0-9]+[^>]*>/gi, "").replace(/<\\/m[a-z0-9]+>/gi, "");
            return s;
          });
        }

        // 2. Decode basic HTML Entities for math & comparison operators
        res = res
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&le;/g, "≤")
          .replace(/&ge;/g, "≥")
          .replace(/&times;/g, "×")
          .replace(/&divide;/g, "÷")
          .replace(/&plusmn;/g, "±")
          .replace(/&deg;/g, "°");

        // Clean LaTeX escaped comparison slashes: \\ <\\ , \\ < , \\ >\\ , \\ >
        res = res.replace(/\\\\?\\s*<\\s*\\\\?/g, " < ");
        res = res.replace(/\\\\?\\s*>\\s*\\\\?/g, " > ");
        res = res.replace(/\\\\?\\s*≤\\s*\\\\?/g, " ≤ ");
        res = res.replace(/\\\\?\\s*≥\\s*\\\\?/g, " ≥ ");
        res = res.replace(/\\\\?\\s*=\\s*\\\\?/g, " = ");

        // 3. Fix spaced chemical element notation: S O_{2} -> SO_{2}, C O_{2} -> CO_{2}, N H_{3} -> NH_{3}
        res = res.replace(/\\bS\\s+O(?=_|\\b)/g, "SO");
        res = res.replace(/\\bC\\s+O(?=_|\\b)/g, "CO");
        res = res.replace(/\\bN\\s+H(?=_|\\b)/g, "NH");
        res = res.replace(/\\bC\\s+H(?=_|\\b)/g, "CH");
        res = res.replace(/\\bC\\s+l(?=_|\\b)/g, "Cl");
        res = res.replace(/\\bH\\s+C\\s+l(?=_|\\b)/g, "HCl");
        res = res.replace(/\\bH\\s+N\\s+O(?=_|\\b)/g, "HNO");
        res = res.replace(/\\bN\\s+a(?=_|\\b)/g, "Na");
        res = res.replace(/\\bM\\s+g(?=_|\\b)/g, "Mg");
        res = res.replace(/\\bC\\s+a(?=_|\\b)/g, "Ca");
        res = res.replace(/\\bF\\s+e(?=_|\\b)/g, "Fe");
        res = res.replace(/\\bA\\s+l(?=_|\\b)/g, "Al");
        res = res.replace(/\\bH\\s+S\\s+O(?=_|\\b)/g, "HSO");

        // 4. Render raw LaTeX \\frac{...}{...}
        if (/\\\\frac\\s*\\{/i.test(res)) {
          res = res.replace(/\\\\frac\\s*\\{([^{}]+)\\}\\s*\\{([^{}]+)\\/gi, (match, num, den) => {
            return '<span class="clean-fraction"><span class="c-num">' + num + '</span><span class="c-den">' + den + '</span></span>';
          });
        }

        // 5. Render raw \\sqrt{...}
        if (/\\\\sqrt\\s*\\{/i.test(res)) {
          res = res.replace(/\\\\sqrt\\s*\\{([^{}]+)\\}/gi, (match, inner) => "√(" + inner + ")");
        }

        // 6. LaTeX symbols conversion
        res = res
          .replace(/\\\\times\\b/g, "×")
          .replace(/\\\\div\\b/g, "÷")
          .replace(/\\\\pm\\b/g, "±")
          .replace(/\\\\mp\\b/g, "∓")
          .replace(/\\\\approx\\b/g, "≈")
          .replace(/\\\\propto\\b/g, "∝")
          .replace(/\\\\ne(?:q)?\\b/g, "≠")
          .replace(/\\\\le(?:q)?\\b/g, "≤")
          .replace(/\\\\ge(?:q)?\\b/g, "≥")
          .replace(/\\\\rightarrow\\b|\\\\to\\b/g, "→")
          .replace(/\\\\Rightarrow\\b/g, "⇒")
          .replace(/\\\\leftarrow\\b/g, "←")
          .replace(/\\\\leftrightarrow\\b/g, "↔")
          .replace(/\\\\Leftrightarrow\\b/g, "⇔")
          .replace(/\\\\degree\\b|\\^\\\\circ/g, "°")
          .replace(/\\\\infty\\b/g, "∞")
          .replace(/\\\\alpha\\b/g, "α")
          .replace(/\\\\beta\\b/g, "β")
          .replace(/\\\\gamma\\b/g, "γ")
          .replace(/\\\\delta\\b/g, "δ")
          .replace(/\\\\Delta\\b/g, "Δ")
          .replace(/\\\\lambda\\b/g, "λ")
          .replace(/\\\\mu\\b/g, "μ")
          .replace(/\\\\pi\\b/g, "π")
          .replace(/\\\\rho\\b/g, "ρ")
          .replace(/\\\\sigma\\b/g, "σ")
          .replace(/\\\\theta\\b/g, "θ")
          .replace(/\\\\omega\\b/g, "ω")
          .replace(/\\\\Omega\\b/g, "Ω");

        // 7. Subscripts & Superscripts conversion
        res = res.replace(/_\\{([^}]+)\\}/g, "<sub>$1</sub>");
        res = res.replace(/\\^\\{([^}]+)\\}/g, "<sup>$1</sup>");
        res = res.replace(/\\^([0-9\\+\\-]+)/g, "<sup>$1</sup>");

        // 8. Clean residual LaTeX escapes
        res = res.replace(/\\\\\\s+/g, " ");
        res = res.replace(/\\\\([a-zA-Z]+)/g, "$1");
        res = res.replace(/\\\\/g, "");

        // 9. Clean multiple spaces
        res = res.replace(/[ \\t]{2,}/g, " ").trim();

        // Highlight Reference & Concept in distinct colors
        if (isExplanation || res.includes('রেফারেন্স') || res.includes('কনসেপ্ট') || res.includes('ধারণা')) {
          res = res.replace(/(?:<b>|<strong>)?(?:রেফারেন্স|Reference)[:\\-–]?(?:<\\/b>|<\\/strong>)?/gi, 
            '<span class="badge-reference"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>রেফারেন্স:</span> ');
          res = res.replace(/(?:<b>|<strong>)?(?:কনসেপ্ট|Concept|ধারণা)[:\\-–]?(?:<\\/b>|<\\/strong>)?/gi, 
            '<span class="badge-concept"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a7 7 0 0 0-7 7c0 2.38 1.19 4.47 3 5.74V17a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 0 0-7-7z"/><path d="M9 21h6"/></svg>কনসেপ্ট:</span> ');
        }

        return res;
      },`;

// Match from formatMathAndFractions(text to normalizeLetter(raw)
const regex = /formatMathAndFractions\(text[\s\S]*?normalizeLetter\(raw\)/;
content = content.replace(regex, `${newFunction}\n\n      normalizeLetter(raw)`);

fs.writeFileSync(indexPath, content, 'utf-8');
console.log('✅ Updated formatMathAndFractions in index.html with automatic spaced-tag normalizer');
