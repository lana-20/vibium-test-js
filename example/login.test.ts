import { test, expect, PageObject } from '../src/index';

class LoginPage extends PageObject {
  emailInput = () => this.page.find({ role: 'textbox', label: 'Email' });
  passwordInput = () => this.page.find({ role: 'textbox', label: 'Password' });
  submitBtn = () => this.page.find({ role: 'button', text: 'Sign in' });
  errorMsg = () => this.page.find({ role: 'alert' });
}

test('successful login navigates to dashboard', async ({ page }) => {
  const login = new LoginPage(page);
  await page.go('/login');

  await (await login.emailInput()).fill('user@example.com');
  await (await login.passwordInput()).fill('secret');
  await (await login.submitBtn()).click();

  await expect(page).toHaveURL('/dashboard');
});

test('wrong password shows error', async ({ page }) => {
  const login = new LoginPage(page);
  await page.go('/login');

  await (await login.emailInput()).fill('user@example.com');
  await (await login.passwordInput()).fill('wrong');
  await (await login.submitBtn()).click();

  const err = await login.errorMsg();
  await expect(err).toBeVisible();
  await expect(err).toHaveText('Invalid credentials');
});
