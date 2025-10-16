// ryuta_takaki.cy.js
// 実サイトのフロー：add.html → （自動で）confirm.html → 「この内容で登録」→ alert → list.html

describe('顧客情報入力フォームのテスト', () => {
  it('入力→確認→登録→成功メッセージ→一覧遷移まで通る', () => {
    // 1) 入力画面を開く
    cy.visit('http://dev.marathon.rplearn.net/ryuta_takaki/customer/add.html');

    // 2) 入力（存在チェックも兼ねておくと原因切り分けが楽）
    cy.get('#customer-form').should('exist');
    cy.fixture('customerData').then((data) => {
      const uniqueContactNumber =
        `03-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;
      cy.get('#companyName').clear().type(data.companyName);
      cy.get('#industry').clear().type(data.industry);
      cy.get('#contact').clear().type(uniqueContactNumber);
      cy.get('#location').clear().type(data.location);
    });

    // 3) 送信（add.html → confirm.html に遷移する想定）
    cy.get('#customer-form').submit();

    // 4) 確認ページに着いたことを確認（URLまたは見出し）
    //    ファイル名が不明でも h2 の「入力内容の確認」で判定できる
    cy.contains('h2', '入力内容の確認').should('be.visible');

    // 5) 成功アラートを捕まえる準備（ページまたぎでも拾いやすいグローバルハンドラ）
    cy.on('window:alert', (text) => {
      expect(text).to.eq('顧客情報を登録しました。'); // ← 実装どおりの文言に合わせる
    });

    // 6) API 完了を待つための intercept（config.apiUrl は不明なのでパスで拾う）
    cy.intercept({ method: 'POST', url: '**/add-customer' }).as('addCustomer');

    // 7) 「この内容で登録」をクリック → POST → alert → list.html へ遷移
    cy.get('#submitButton').should('be.enabled').click();

    // 8) ネットワーク完了を待つ（最大10秒など余裕を）
    cy.wait('@addCustomer', { timeout: 10000 }).its('response.statusCode').should('be.oneOf', [200, 201]);

    // 9) 一覧画面（list.html）へ遷移したことを確認
    cy.url().should('include', '/ryuta_takaki/customer/list.html');

    // （任意）一覧側で何かしら要素を確認したい場合はここで追記
    // cy.contains('顧客一覧').should('be.visible');
  });
});
