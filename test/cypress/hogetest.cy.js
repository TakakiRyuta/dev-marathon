// ryuta_takaki.cy.js

describe('顧客情報入力フォームのテスト', () => {

  it('入力→確認→登録→成功メッセージ→一覧遷移まで通る', () => {
    const base = 'http://dev.marathon.rplearn.net/ryuta_takaki/customer';

    cy.visit(`${base}/add.html`);
    cy.get('#customer-form').should('exist');

    cy.fixture('customerData').then((data) => {
      const uniqueContactNumber =
        `03-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;
      cy.get('#companyName').clear().type(data.companyName);
      cy.get('#industry').clear().type(data.industry);
      cy.get('#contact').clear().type(uniqueContactNumber);
      cy.get('#location').clear().type(data.location);
    });

    cy.intercept('POST', '**/add-customer').as('addCustomer');
    cy.get('#customer-form').submit();

    cy.contains('h2', '入力内容の確認').should('be.visible');
    cy.window().then(win => cy.stub(win, 'alert').as('alertRegister'));

    cy.get('#submitButton').should('be.enabled').click();
    cy.wait('@addCustomer', { timeout: 10000 })
      .its('response.statusCode')
      .should('be.oneOf', [200, 201]);

    cy.get('@alertRegister')
      .should('have.been.calledOnceWith', '顧客情報を登録しました。');

    cy.url().should('include', '/ryuta_takaki/customer/list.html');
  });

  it('更新できているか', () => {
    const base = 'http://dev.marathon.rplearn.net/ryuta_takaki/customer';
    const unique = Date.now();
    const companyName = `Cypress顧客 ${unique}`;
    const industry = `業種-${unique}`;
    const contact = `03-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;
    const location = '東京都渋谷区';
    const updated = {
      companyName: `${companyName}-更新`,
      industry: `${industry}-更新`,
      contact: contact.replace(/^03-/, '06-'),
      location: `${location} 2F`,
    };

    cy.intercept('POST', '**/add-customer').as('addCustomer');
    cy.intercept('GET', '**/customers').as('getCustomers');
    cy.intercept('GET', '**/customer/*').as('getCustomer');
    cy.intercept('PUT', '**/customer/*').as('updateCustomer');

    cy.visit(`${base}/add.html`);
    cy.get('#customer-form').should('exist');
    cy.get('#companyName').clear().type(companyName);
    cy.get('#industry').clear().type(industry);
    cy.get('#contact').clear().type(contact);
    cy.get('#location').clear().type(location);

    cy.get('#customer-form').submit();
    cy.contains('h2', '入力内容の確認').should('be.visible');
    cy.window().then(win => cy.stub(win, 'alert').as('alertRegister'));

    cy.get('#submitButton').should('be.enabled').click();
    cy.wait('@addCustomer', { timeout: 10000 })
      .its('response.statusCode')
      .should('be.oneOf', [200, 201]);

    cy.get('@alertRegister')
      .should('have.been.calledOnceWith', '顧客情報を登録しました。');

    cy.wait('@getCustomers', { timeout: 10000 }).its('response.statusCode').should('eq', 200);

    // 一覧で該当行をクリックして詳細へ
    cy.contains('#customer-list a', companyName, { timeout: 10000 }).should('be.visible').click();
    cy.wait('@getCustomer', { timeout: 10000 }).its('response.statusCode').should('eq', 200);

    cy.get('#companyNameCell').should('have.text', companyName);
    cy.get('#industryCell').should('have.text', industry);
    cy.get('#contactCell').should('have.text', contact);
    cy.get('#locationCell').should('have.text', location);

    // 🟢 修正ポイント：方式Cで「編集」ボタンをクリック
    cy.contains('a.btn-primary', '編集').click();

    cy.wait('@getCustomer', { timeout: 10000 }).its('response.statusCode').should('eq', 200);
    cy.location('pathname').should('include', '/ryuta_takaki/customer/update.html');

    cy.get('#companyName').should('have.value', companyName).clear().type(updated.companyName);
    cy.get('#industry').should('have.value', industry).clear().type(updated.industry);
    cy.get('#contact').should('have.value', contact).clear().type(updated.contact);
    cy.get('#location').should('have.value', location).clear().type(updated.location);

    cy.window().then(win => cy.stub(win, 'alert').as('alertUpdate'));
    cy.get('#customerForm').submit();

    cy.wait('@updateCustomer', { timeout: 10000 })
      .its('response.statusCode')
      .should('be.oneOf', [200, 204]);

    cy.get('@alertUpdate')
      .should('have.been.calledOnceWith', '顧客情報を更新しました。');

    cy.wait('@getCustomer', { timeout: 10000 })
      .its('response.statusCode')
      .should('eq', 200);

    cy.get('#companyNameCell').should('have.text', updated.companyName);
    cy.get('#industryCell').should('have.text', updated.industry);
    cy.get('#contactCell').should('have.text', updated.contact);
    cy.get('#locationCell').should('have.text', updated.location);

    cy.contains('a.btn-secondary', '一覧に戻る').click();
    cy.wait('@getCustomers', { timeout: 10000 })
      .its('response.statusCode')
      .should('eq', 200);

    cy.contains('#customer-list a', updated.companyName).should('be.visible');
    cy.contains('#customer-list tr', updated.companyName).within(() => {
      cy.contains('td', updated.contact).should('exist');
      cy.contains('td', updated.industry).should('exist');
      cy.contains('td', updated.location).should('exist');
    });
  });

it('削除できるか', () => {
  const base = 'http://dev.marathon.rplearn.net/ryuta_takaki/customer';
  const unique = Date.now();
  const companyName = `Cypress顧客 ${unique}`;
  const industry = `業種-${unique}`;
  const contact = `03-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;
  const location = '東京都渋谷区';

  // API監視
  cy.intercept('POST', '**/add-customer').as('addCustomer');
  cy.intercept('GET',  '**/customers').as('getCustomers');
  cy.intercept('GET',  '**/customer/*').as('getCustomer');
  cy.intercept('DELETE', '**/customer/*').as('deleteCustomer');

  // 1) まずは削除対象の顧客を新規登録
  cy.visit(`${base}/add.html`);
  cy.get('#customer-form').should('exist');
  cy.get('#companyName').clear().type(companyName);
  cy.get('#industry').clear().type(industry);
  cy.get('#contact').clear().type(contact);
  cy.get('#location').clear().type(location);
  cy.get('#customer-form').submit();

  // 確認ページ → 登録
  cy.contains('h2', '入力内容の確認').should('be.visible');
  cy.window().then(win => cy.stub(win, 'alert').as('alertRegister')); // 登録時のアラート
  cy.get('#submitButton').should('be.enabled').click();

  cy.wait('@addCustomer', { timeout: 10000 })
    .its('response.statusCode')
    .should('be.oneOf', [200, 201]);

  cy.get('@alertRegister')
    .should('have.been.calledOnceWith', '顧客情報を登録しました。');

  cy.wait('@getCustomers', { timeout: 10000 })
    .its('response.statusCode').should('eq', 200);

  // 2) 一覧から詳細へ（あなたのList DOMに合わせて <a> のテキストで特定）
  cy.contains('#customer-list a', companyName, { timeout: 10000 })
    .should('be.visible')
    .click();

  cy.wait('@getCustomer', { timeout: 10000 })
    .its('response.statusCode').should('eq', 200);

  // 3) 詳細画面で削除ボタンを押す
  //    このページの window に対して削除用 alert をスタブ（2回鳴る想定）
  //    1回目: 「削除していいですか?」 2回目: 「顧客情報を削除しました。」
  cy.window().then(win => cy.stub(win, 'alert').as('alertDelete'));

  cy.get('#deleteButton').should('be.visible').and('be.enabled').click();

  // DELETE API が完了するのを待つ
  cy.wait('@deleteCustomer', { timeout: 10000 })
    .its('response.statusCode')
    .should('be.oneOf', [200, 204]);

  // アラートの呼び出し順と文言を厳密に確認
  cy.get('@alertDelete').should('have.callCount', 2)
    .then(stub => {
      expect(stub.getCall(0).args[0]).to.eq('削除していいですか?');
      expect(stub.getCall(1).args[0]).to.eq('顧客情報を削除しました。');
    });

  // 4) list.html に戻ったら、今作った顧客がもう無いことを確認
  cy.wait('@getCustomers', { timeout: 10000 })
    .its('response.statusCode').should('eq', 200);

  cy.contains('#customer-list a', companyName).should('not.exist');
});

});
