/**
 * 검색 토크나이저.
 *
 * orama 기본 토크나이저는 라틴 문자 기준이라 공백이 없는 CJK 본문을
 * 통째로 한 토큰으로 잡는다. 언어별로 분해 규칙을 따로 준다.
 */

/** 한국어: 공백·문장부호 기준 분리로 충분하다 (띄어쓰기가 있는 언어). */
export const koTokenize = (text: string): string[] =>
  text.split(/[\s,.!?;:()[\]{}'"]+/).filter(Boolean);

/**
 * 중국어·일본어: 띄어쓰기가 없어 공백 분리가 통하지 않는다.
 * 한자/가나는 bigram(2글자 묶음)으로, 라틴/숫자는 단어 단위로 쪼갠다.
 * 질의도 같은 함수를 거치므로 색인과 항상 짝이 맞는다.
 */
export const cjkTokenize = (text: string): string[] => {
  const tokens: string[] = [];
  for (const [chunk] of text.matchAll(
    /[A-Za-z0-9_]+|[ぁ-ゟ゠-ヿ㐀-鿿豈-﫿]+/g,
  )) {
    if (/^[A-Za-z0-9_]+$/.test(chunk)) {
      tokens.push(chunk.toLowerCase());
    } else if (chunk.length === 1) {
      tokens.push(chunk);
    } else {
      for (let i = 0; i < chunk.length - 1; i++) tokens.push(chunk.slice(i, i + 2));
    }
  }
  return tokens;
};

/**
 * 여기 없는 로케일(en, es 등)은 orama 기본 라틴 토크나이저를 쓴다.
 * 띄어쓰기가 있는 언어라 별도 분해가 필요 없다.
 */
export const localeTokenizers: Record<string, (text: string) => string[]> = {
  ko: koTokenize,
  'zh-TW': cjkTokenize,
  ja: cjkTokenize,
};
