# Supabase Storage Organization

This document outlines the file storage structure for the Gemstone CRM application.

## Storage Buckets

### 1. `customer-photos` Bucket
**Purpose:** Store customer profile photos and related images

**Path Structure:**
\`\`\`
customer-photos/
└── customers/
    ├── {timestamp}-{random}.jpg
    ├── {timestamp}-{random}.png
    └── ...
\`\`\`

**Usage:**
- Customer profile photos
- Customer-related documents or images

**Access:** Public read access for displaying customer photos in the UI

---

### 2. `manufacturing-photos` Bucket
**Purpose:** Store manufacturing project photos and product images

**Path Structure:**
\`\`\`
manufacturing-photos/
└── manufacturing/
    ├── {timestamp}-{random}.jpg
    ├── {timestamp}-{random}.png
    └── ...
\`\`\`

**Usage:**
- Manufacturing project progress photos
- Finished product photos
- Quality control images
- Certificate photos

**Access:** Public read access for displaying product photos in the UI

---

## Upload API

### Endpoint: `/api/upload`

**Method:** POST

**Parameters:**
- `file` (File): The file to upload
- `type` (string, optional): Upload type - "customer" or "manufacturing" (defaults to "customer")

**Response:**
\`\`\`json
{
  "url": "https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]"
}
\`\`\`

**Example Usage:**
\`\`\`typescript
const formData = new FormData()
formData.append("file", file)
formData.append("type", "customer") // or "manufacturing"

const response = await fetch("/api/upload", {
  method: "POST",
  body: formData,
})

const { url } = await response.json()
\`\`\`

---

## File Naming Convention

All uploaded files use the following naming pattern:
\`\`\`
{timestamp}-{random}.{extension}
\`\`\`

- `timestamp`: Unix timestamp in milliseconds (Date.now())
- `random`: Random alphanumeric string (7 characters)
- `extension`: Original file extension

**Example:** `1704067200000-a3f9k2m.jpg`

This ensures:
- Unique filenames (no collisions)
- Chronological ordering
- Original file type preservation

---

## Storage Policies

### Bucket Policies (Recommended)

**customer-photos:**
- Public read access
- Authenticated write access
- File size limit: 5MB
- Allowed types: image/jpeg, image/png, image/webp

**manufacturing-photos:**
- Public read access
- Authenticated write access
- File size limit: 10MB
- Allowed types: image/jpeg, image/png, image/webp

---

## Best Practices

1. **Always specify the upload type** when calling the upload API
2. **Delete old photos** when updating (to avoid storage bloat)
3. **Validate file types** on the client before uploading
4. **Compress images** before upload when possible
5. **Use loading states** during upload operations
6. **Handle upload errors** gracefully with user feedback

---

## Migration Notes

If you have existing files with the old path structure (`customer-photos/customer-photos/...`), you can migrate them using the Supabase dashboard or a migration script.

**Old Structure:**
\`\`\`
customer-photos/customer-photos/{filename}  ❌
\`\`\`

**New Structure:**
\`\`\`
customer-photos/customers/{filename}  ✅
\`\`\`

---

## Future Considerations

As the application grows, consider adding:
- Additional buckets for different file types (documents, certificates, etc.)
- Folder organization by date (e.g., `customers/2025/01/...`)
- Thumbnail generation for images
- CDN integration for faster delivery
- Automatic image optimization
