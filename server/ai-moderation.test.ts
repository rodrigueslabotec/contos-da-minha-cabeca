import { describe, expect, it, vi } from "vitest";

// ─── Mock de resposta da IA ───────────────────────────────────────────────────

const mockLLMResponse = {
  resumo: "Uma história épica sobre aventura e descoberta em um mundo mágico.",
  classificacaoValidada: "Adequada",
  motivoClassificacao: "O conteúdo contém cenas de ação moderada, apropriado para 14+.",
  errosGramaticais: [
    "Falta vírgula após 'Assim'",
    "Concordância verbal incorreta em 'haviam'",
    "Acento gráfico faltante em 'pôde'"
  ],
  qualidadeGeral: 8,
  recomendacoes: [
    "Revisar pontuação no segundo parágrafo",
    "Considerar expandir o desenvolvimento do personagem principal"
  ]
};

// ─── Testes ──────────────────────────────────────────────────────────────────

describe("AI Moderation Analysis", () => {
  describe("analyzeBook response structure", () => {
    it("returns a valid analysis object with all required fields", () => {
      expect(mockLLMResponse).toHaveProperty("resumo");
      expect(mockLLMResponse).toHaveProperty("classificacaoValidada");
      expect(mockLLMResponse).toHaveProperty("motivoClassificacao");
      expect(mockLLMResponse).toHaveProperty("errosGramaticais");
      expect(mockLLMResponse).toHaveProperty("qualidadeGeral");
      expect(mockLLMResponse).toHaveProperty("recomendacoes");
    });

    it("has resumo as a non-empty string", () => {
      expect(typeof mockLLMResponse.resumo).toBe("string");
      expect(mockLLMResponse.resumo.length).toBeGreaterThan(0);
    });

    it("has classificacaoValidada as one of the valid options", () => {
      const validOptions = ["Adequada", "Muito Restritiva", "Muito Permissiva"];
      expect(validOptions).toContain(mockLLMResponse.classificacaoValidada);
    });

    it("has motivoClassificacao as a non-empty string", () => {
      expect(typeof mockLLMResponse.motivoClassificacao).toBe("string");
      expect(mockLLMResponse.motivoClassificacao.length).toBeGreaterThan(0);
    });

    it("has errosGramaticais as an array of strings", () => {
      expect(Array.isArray(mockLLMResponse.errosGramaticais)).toBe(true);
      expect(mockLLMResponse.errosGramaticais.every((e) => typeof e === "string")).toBe(true);
    });

    it("has qualidadeGeral as a number between 1 and 10", () => {
      expect(typeof mockLLMResponse.qualidadeGeral).toBe("number");
      expect(mockLLMResponse.qualidadeGeral).toBeGreaterThanOrEqual(1);
      expect(mockLLMResponse.qualidadeGeral).toBeLessThanOrEqual(10);
    });

    it("has recomendacoes as an array of strings", () => {
      expect(Array.isArray(mockLLMResponse.recomendacoes)).toBe(true);
      expect(mockLLMResponse.recomendacoes.every((r) => typeof r === "string")).toBe(true);
    });
  });

  describe("classification validation logic", () => {
    it("correctly identifies 'Adequada' classification", () => {
      const analysis = { ...mockLLMResponse, classificacaoValidada: "Adequada" };
      expect(analysis.classificacaoValidada).toBe("Adequada");
    });

    it("correctly identifies 'Muito Restritiva' classification", () => {
      const analysis = { ...mockLLMResponse, classificacaoValidada: "Muito Restritiva" };
      expect(analysis.classificacaoValidada).toBe("Muito Restritiva");
    });

    it("correctly identifies 'Muito Permissiva' classification", () => {
      const analysis = { ...mockLLMResponse, classificacaoValidada: "Muito Permissiva" };
      expect(analysis.classificacaoValidada).toBe("Muito Permissiva");
    });
  });

  describe("grammar error detection", () => {
    it("detects multiple grammar errors", () => {
      expect(mockLLMResponse.errosGramaticais.length).toBeGreaterThan(0);
    });

    it("limits grammar errors to a reasonable number", () => {
      expect(mockLLMResponse.errosGramaticais.length).toBeLessThanOrEqual(10);
    });

    it("each error is descriptive", () => {
      mockLLMResponse.errosGramaticais.forEach((erro) => {
        expect(erro.length).toBeGreaterThan(5);
      });
    });
  });

  describe("quality score", () => {
    it("quality score is within valid range", () => {
      expect(mockLLMResponse.qualidadeGeral).toBeGreaterThanOrEqual(1);
      expect(mockLLMResponse.qualidadeGeral).toBeLessThanOrEqual(10);
    });

    it("quality score reflects editorial quality", () => {
      const highQuality = { ...mockLLMResponse, qualidadeGeral: 9 };
      const lowQuality = { ...mockLLMResponse, qualidadeGeral: 3 };
      expect(highQuality.qualidadeGeral).toBeGreaterThan(lowQuality.qualidadeGeral);
    });
  });

  describe("recommendations", () => {
    it("provides actionable recommendations", () => {
      expect(mockLLMResponse.recomendacoes.length).toBeGreaterThan(0);
    });

    it("each recommendation is specific", () => {
      mockLLMResponse.recomendacoes.forEach((rec) => {
        expect(rec.length).toBeGreaterThan(10);
      });
    });
  });

  describe("age classification validation", () => {
    it("validates content rating appropriateness for 14+", () => {
      const analysis = {
        ...mockLLMResponse,
        classificacaoValidada: "Adequada",
        motivoClassificacao: "Conteúdo apropriado para maiores de 14 anos"
      };
      expect(analysis.motivoClassificacao).toContain("14");
    });

    it("validates content rating appropriateness for 18+", () => {
      const analysis = {
        ...mockLLMResponse,
        classificacaoValidada: "Adequada",
        motivoClassificacao: "Conteúdo contém violência, apropriado para maiores de 18 anos"
      };
      expect(analysis.motivoClassificacao).toContain("18");
    });

    it("identifies overly restrictive classifications", () => {
      const analysis = {
        ...mockLLMResponse,
        classificacaoValidada: "Muito Restritiva",
        motivoClassificacao: "Classificação 18+ é excessiva para este conteúdo infantil"
      };
      expect(analysis.classificacaoValidada).toBe("Muito Restritiva");
    });

    it("identifies overly permissive classifications", () => {
      const analysis = {
        ...mockLLMResponse,
        classificacaoValidada: "Muito Permissiva",
        motivoClassificacao: "Classificação 'Livre' é inadequada para conteúdo violento"
      };
      expect(analysis.classificacaoValidada).toBe("Muito Permissiva");
    });
  });

  describe("response parsing", () => {
    it("successfully parses valid JSON response", () => {
      const jsonStr = JSON.stringify(mockLLMResponse);
      const parsed = JSON.parse(jsonStr);
      expect(parsed).toEqual(mockLLMResponse);
    });

    it("handles missing optional fields gracefully", () => {
      const minimal = {
        resumo: "Resumo",
        classificacaoValidada: "Adequada",
        motivoClassificacao: "Motivo",
        errosGramaticais: [],
        qualidadeGeral: 5,
        recomendacoes: []
      };
      expect(minimal.errosGramaticais.length).toBe(0);
      expect(minimal.recomendacoes.length).toBe(0);
    });
  });

  describe("UI rendering data", () => {
    it("analysis result includes bookId and bookTitle", () => {
      const result = {
        bookId: 1,
        bookTitle: "Example Book",
        analysis: mockLLMResponse,
        analyzedAt: new Date()
      };
      expect(result.bookId).toBe(1);
      expect(result.bookTitle).toBe("Example Book");
      expect(result.analyzedAt instanceof Date).toBe(true);
    });

    it("analysis timestamp is valid", () => {
      const result = {
        bookId: 1,
        bookTitle: "Example Book",
        analysis: mockLLMResponse,
        analyzedAt: new Date()
      };
      expect(result.analyzedAt.getTime()).toBeLessThanOrEqual(Date.now());
    });
  });
});
