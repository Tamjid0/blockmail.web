# QUICKSTART

> **Get started with Blockmail in 5 minutes**

---

## 1. Create Account

1. Go to [blockmail.dev](https://blockmail.dev)
2. Click **Sign Up**
3. Sign in with Google, GitHub, or email
4. You're in the dashboard!

---

## 2. Get API Key

1. In the dashboard, go to **API Keys**
2. Click **Create API Key**
3. Name it (e.g., "Production")
4. Click **Create**
5. **Copy the key** — it's shown only once!

---

## 3. Verify Your First Email

### cURL

```bash
curl -X POST https://api.blockmail.dev/api/v1/verify \
  -H "Content-Type: application/json" \
  -H "X-API-Key: bm_live_xxxxx" \
  -d '{"email": "test@mailinator.com"}'
```

### Response

```json
{
  "success": true,
  "data": {
    "email": "test@mailinator.com",
    "is_disposable": true,
    "risk_score": 95,
    "analysis": {
      "tier_triggered": 2,
      "reason": "domain_blocklist_hit",
      "domain": "mailinator.com"
    }
  }
}
```

---

## 4. Integrate in Your App

### JavaScript/TypeScript

```bash
npm install @blockmail/sdk
```

```typescript
import { Blockmail } from '@blockmail/sdk';

const blockmail = new Blockmail('bm_live_xxxxx');

async function validateSignup(email: string) {
  const result = await blockmail.verify(email);
  
  if (result.is_disposable) {
    throw new Error('Disposable email not allowed');
  }
  
  // Email is valid, proceed with signup
}
```

### Python

```bash
pip install blockmail
```

```python
from blockmail import Blockmail

client = Blockmail(api_key="bm_live_xxxxx")

def validate_signup(email: str):
    result = client.verify(email)
    
    if result.is_disposable:
        raise ValueError("Disposable email not allowed")
    
    # Email is valid, proceed with signup
```

### Go

```bash
go get github.com/blockmail/blockmail-go
```

```go
import blockmail "github.com/blockmail/blockmail-go"

client := blockmail.New("bm_live_xxxxx")

func validateSignup(email string) error {
    result, err := client.Verify(email, nil)
    if err != nil {
        return err
    }
    
    if result.IsDisposable {
        return errors.New("Disposable email not allowed")
    }
    
    // Email is valid, proceed with signup
    return nil
}
```

### PHP

```bash
composer require blockmail/blockmail-php
```

```php
use Blockmail\Blockmail;

$client = new Blockmail('bm_live_xxxxx');

function validateSignup(string $email): void {
    $result = $client->verify($email);
    
    if ($result->isDisposal) {
        throw new \Exception('Disposable email not allowed');
    }
    
    // Email is valid, proceed with signup
}
```

---

## 5. Check Usage

In your dashboard, go to **Usage** to see:
- Total requests
- Blocked vs allowed
- Daily trends
- Top blocked domains

---

## Next Steps

- [Read the API Reference](/docs/api-reference)
- [Set up Webhooks](/docs/webhooks)
- [View Code Examples](/docs/examples)
- [Upgrade Your Plan](/pricing)

---

## Need Help?

- **Docs:** [blockmail.dev/docs](https://blockmail.dev/docs)
- **Support:** support@blockmail.dev
- **GitHub:** github.com/blockmail/blockmail

---

**Welcome to Blockmail!**
