# Duplicate Content Cleanup Tool

This tool automatically processes content items that are marked as duplicates in the admin panel and moves them to the deleted content collection, keeping only the highest quality version of each content.

## How It Works

1. The script finds all content marked as `isDuplicate: true` in the database
2. For each duplicate item, it finds similar content using the duplicate detector service
3. It groups highly similar content together (similarity score > 0.8)
4. For each group of similar content, it keeps the highest quality version based on:
   - Status (published > pending > draft)
   - Engagement metrics (views + likes)
   - Recency (newer content preferred)
5. All other duplicates are moved to the DeletedContent collection with `reason: 'duplicate'`

## Usage

To run the duplicate cleanup process:

```bash
cd backend
npm run cleanup-duplicates
```

## Results

After running the script, you will see:
- How many duplicate items were found
- How many sets of similar content were identified
- How many items were moved to the deleted content collection

## Manual Process vs Automated Cleanup

The admin panel lets you mark content as duplicates, and this script automates the process of analyzing those duplicates and keeping only the best version.

You should still use the admin panel to identify and mark potential duplicates first, then run this script to process all marked duplicates at once.

## Maintenance

This script can be run periodically to clean up duplicate content. Consider setting up a scheduled job to run it automatically at regular intervals. 