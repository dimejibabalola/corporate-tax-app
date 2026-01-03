import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to copy directory recursively
function copyDir(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }
    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

const ROOT_DIR = path.resolve(__dirname, '..');
const SOURCE_DIR = path.join(ROOT_DIR, 'parsed-chapters');
const DEST_BASE_DIR = path.join(ROOT_DIR, 'public', 'data', 'mineru');

// Map directory names to simple Ch{N} format
const DIR_MAP = {
    'Ch2_Formation_of_Corp': 'Ch2',
    'Ch3_Capital_Structure': 'Ch3',
    'Ch4_Nonliquidating_Distributions': 'Ch4',
    'Ch5_Redemptions_and_Partial_Liq': 'Ch5',
    'Ch6_Stock_Dividends_and_Sec_306': 'Ch6',
    'Ch7_Complete_Liquidations': 'Ch7',
    'Ch8_Taxable_Corp_Acquisitions': 'Ch8',
    'Ch9_Acquisitive_Reorgs': 'Ch9',
    'Ch10_Corp_Divisions': 'Ch10',
    'Ch11_Nonacquisitive_Reorgs': 'Ch11',
    'Ch12_Carryovers_of_Attributes': 'Ch12',
    'Ch13_Affiliated_Corps': 'Ch13',
    'Ch14_Anti_Avoidance_Rules': 'Ch14',
    'Ch15_S_Corporations': 'Ch15',
};

async function migrate() {
    console.log('Starting migration...');

    // Clear destination if it exists (optional, but good for clean state)
    // if (fs.existsSync(DEST_BASE_DIR)) {
    //     fs.rmSync(DEST_BASE_DIR, { recursive: true, force: true });
    // }

    if (!fs.existsSync(DEST_BASE_DIR)) {
        fs.mkdirSync(DEST_BASE_DIR, { recursive: true });
    }

    for (const [srcName, destName] of Object.entries(DIR_MAP)) {
        const srcPath = path.join(SOURCE_DIR, srcName);
        const destPath = path.join(DEST_BASE_DIR, destName);

        if (fs.existsSync(srcPath)) {
            console.log(`Migrating ${srcName} -> ${destName}`);

            // Create destination chapter dir
            if (!fs.existsSync(destPath)) {
                fs.mkdirSync(destPath, { recursive: true });
            }

            // Copy contents
            // We need to rename the weird {UUID}_content_list.json to content_list.json
            const files = fs.readdirSync(srcPath);
            for (const file of files) {
                const filePath = path.join(srcPath, file);

                if (file.endsWith('_content_list.json')) {
                    fs.copyFileSync(filePath, path.join(destPath, 'content_list.json'));
                    console.log(`  - Copied content_list.json`);
                } else if (file === 'images') { // Copy images dir
                    copyDir(filePath, path.join(destPath, 'images'));
                    console.log(`  - Copied images/`);
                }
            }
        } else {
            console.warn(`Source directory not found: ${srcName}`);
        }
    }

    console.log('Migration complete!');
}

migrate().catch(console.error);
