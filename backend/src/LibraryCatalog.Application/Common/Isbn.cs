namespace LibraryCatalog.Application.Common;

/// <summary>
/// ISBN-10 and ISBN-13 checksum validation. A malformed ISBN is not a formatting
/// nit — it is a wrong identifier that would silently point at another book.
/// </summary>
public static class Isbn
{
    /// <summary>Strips hyphens and spaces so "978-0-441-47812-5" and "9780441478125" are the same value.</summary>
    public static string Normalize(string value) =>
        new(value.Where(char.IsLetterOrDigit).ToArray());

    public static bool IsValid(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return false;
        }

        var normalized = Normalize(value).ToUpperInvariant();

        return normalized.Length switch
        {
            10 => IsValidIsbn10(normalized),
            13 => IsValidIsbn13(normalized),
            _ => false
        };
    }

    private static bool IsValidIsbn10(string value)
    {
        var sum = 0;

        for (var i = 0; i < 9; i++)
        {
            if (!char.IsDigit(value[i]))
            {
                return false;
            }

            sum += (value[i] - '0') * (10 - i);
        }

        // The final character is a check digit where 'X' stands for 10.
        var checkDigit = value[9] switch
        {
            'X' => 10,
            var c when char.IsDigit(c) => c - '0',
            _ => -1
        };

        return checkDigit >= 0 && (sum + checkDigit) % 11 == 0;
    }

    private static bool IsValidIsbn13(string value)
    {
        if (!value.All(char.IsDigit))
        {
            return false;
        }

        var sum = 0;

        for (var i = 0; i < 12; i++)
        {
            sum += (value[i] - '0') * (i % 2 == 0 ? 1 : 3);
        }

        var checkDigit = (10 - sum % 10) % 10;

        return checkDigit == value[12] - '0';
    }
}
