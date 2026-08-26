import { expect, test } from '@playwright/test'
import type { Page, Request } from '@playwright/test'

const staff = {
  email: 'admin@librarycatalog.dev',
  password: 'Admin@123',
}

function uniqueName(kind: string): string {
  return `E2E ${kind} ${Date.now()} ${Math.random().toString(36).slice(2, 8)}`
}

function uniqueIsbn(): string {
  const body = `978${Date.now().toString().slice(-9)}`
  const weightedSum = [...body]
    .map((digit, index) => Number(digit) * (index % 2 === 0 ? 1 : 3))
    .reduce((sum, value) => sum + value, 0)

  return `${body}${(10 - (weightedSum % 10)) % 10}`
}

function rowFor(page: Page, recordName: string) {
  return page
    .getByRole('row')
    .filter({ has: page.getByRole('link', { name: recordName, exact: true }) })
}

async function waitForCatalog(page: Page) {
  const booksTable = page.getByRole('table')
  const loadError = page.getByRole('alert')
  let onRequestFailed: ((request: Request) => void) | undefined

  const failedCatalogRequest = new Promise<never>((_, reject) => {
    onRequestFailed = (request) => {
      if (new URL(request.url()).pathname !== '/api/v1/books') {
        return
      }

      const reason = request.failure()?.errorText ?? 'unknown network error'
      reject(new Error(`Catalog request failed (${reason}). Check VITE_API_BASE_URL and CORS.`))
    }

    page.on('requestfailed', onRequestFailed)
  })

  try {
    await Promise.race([
      (async () => {
        await expect(booksTable.or(loadError)).toBeVisible({ timeout: 10_000 })

        if (await loadError.isVisible()) {
          throw new Error(`Catalog failed to load: ${await loadError.textContent()}`)
        }
      })(),
      failedCatalogRequest,
    ])
  } finally {
    if (onRequestFailed) {
      page.off('requestfailed', onRequestFailed)
    }
  }
}

async function deleteRecord(
  page: Page,
  listName: 'Books' | 'Authors' | 'Genres',
  recordName: string,
  confirmationName: string,
) {
  await page.getByRole('link', { name: listName, exact: true }).click()

  const resource = listName.toLowerCase()
  const search = page.getByRole('searchbox', { name: `Search ${resource}` })
  const matchingSearch = page.waitForResponse((response) => {
    const url = new URL(response.url())

    return (
      response.request().method() === 'GET' &&
      url.pathname === `/api/v1/${resource}` &&
      url.searchParams.get('search') === recordName
    )
  })

  await search.fill(recordName)
  await matchingSearch

  const row = rowFor(page, recordName)
  const emptyState = page.getByText('No records match this view.')

  await expect(row.or(emptyState)).toBeVisible()

  if (await row.count() === 0) {
    return
  }

  await row.getByRole('button', { name: 'Delete', exact: true }).click()

  const dialog = page.getByRole('dialog', { name: confirmationName, exact: true })
  await dialog.getByRole('button', { name: confirmationName, exact: true }).click()

  await expect(row).toHaveCount(0)
}

test('staff can create, view, and remove a book with its author and genre', async ({ page }) => {
  const genreName = uniqueName('Genre')
  const authorName = uniqueName('Author')
  const bookTitle = uniqueName('Book')
  const isbn = uniqueIsbn()
  let signedIn = false

  try {
    const catalogReady = waitForCatalog(page)
    await page.goto('/books')
    await catalogReady

    await page.getByRole('button', { name: 'Sign in', exact: true }).click()

    const loginDialog = page.getByRole('dialog', { name: 'Sign in', exact: true })
    await loginDialog.getByLabel('Email').fill(staff.email)
    await loginDialog.getByLabel('Password').fill(staff.password)
    await loginDialog.getByRole('button', { name: 'Sign in', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Sign out', exact: true })).toBeVisible()
    signedIn = true

    await page.getByRole('link', { name: 'Genres', exact: true }).click()
    await page.getByRole('button', { name: 'New genre', exact: true }).click()

    const genreDialog = page.getByRole('dialog', { name: 'New genre', exact: true })
    await genreDialog.getByLabel('Name').fill(genreName)
    await genreDialog.getByLabel('Description').fill('Created by the end-to-end golden path.')
    await genreDialog.getByRole('button', { name: 'Save genre', exact: true }).click()
    await expect(rowFor(page, genreName)).toBeVisible()

    await page.getByRole('link', { name: 'Authors', exact: true }).click()
    await page.getByRole('button', { name: 'New author', exact: true }).click()

    const authorDialog = page.getByRole('dialog', { name: 'New author', exact: true })
    await authorDialog.getByLabel('Name').fill(authorName)
    await authorDialog.getByLabel('Birth date').fill('1970-01-01')
    await authorDialog.getByLabel('Nationality').fill('E2E')
    await authorDialog.getByRole('button', { name: 'Save author', exact: true }).click()
    await expect(rowFor(page, authorName)).toBeVisible()

    await page.getByRole('link', { name: 'Books', exact: true }).click()
    await page.getByRole('button', { name: 'New book', exact: true }).click()

    const bookDialog = page.getByRole('dialog', { name: 'New book', exact: true })
    await bookDialog.getByLabel('Title').fill(bookTitle)
    await bookDialog.getByLabel('ISBN').fill(isbn)
    await bookDialog.getByLabel('Publication year').fill('2001')
    await expect(bookDialog.getByLabel('Author')).toBeEnabled()
    await bookDialog.getByLabel('Author').selectOption({ label: authorName })
    await bookDialog.getByLabel('Genre').selectOption({ label: genreName })
    await bookDialog.getByRole('button', { name: 'Save book', exact: true }).click()

    const bookRow = rowFor(page, bookTitle)
    await expect(bookRow).toBeVisible()
    await expect(bookRow.getByRole('link', { name: authorName, exact: true })).toBeVisible()
    await expect(bookRow.getByRole('link', { name: genreName, exact: true })).toBeVisible()
  } finally {
    if (signedIn) {
      await deleteRecord(page, 'Books', bookTitle, 'Delete book')
      await deleteRecord(page, 'Authors', authorName, 'Delete author')
      await deleteRecord(page, 'Genres', genreName, 'Delete genre')
    }
  }
})
