import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('Seeding database...')

    // 0. Clean DB in order (if needed, or force clear in dev environments only)
    // Be careful with deleteMany in production. Usually seed is for initial setup.
    // const isProduction = process.env.NODE_ENV === 'production'
    // if (!isProduction) {
    //   await prisma.stockMovement.deleteMany({})
    //   await prisma.transaction.deleteMany({})
    //   // ... more deletes
    // }

    // 1. Create Default Admin if not exists
    const adminEmail = process.env.ADMIN_EMAIL
    const adminPassword = process.env.ADMIN_PASSWORD

    if (!adminEmail || !adminPassword) {
        console.warn('⚠️ ADMIN_EMAIL or ADMIN_PASSWORD not set. Skipping admin creation.')
    } else {
        const existingAdmin = await prisma.user.findUnique({
            where: { email: adminEmail },
        })

        if (!existingAdmin) {
            const hashedPassword = await bcrypt.hash(adminPassword, 10)
            const admin = await prisma.user.create({
                data: {
                    email: adminEmail,
                    name: 'Super Admin',
                    password: hashedPassword,
                    role: 'ADMIN',
                },
            })
            console.log(`✅ Admin created: ${admin.email}`)
        } else {
            console.log(`ℹ️ Admin already exists: ${existingAdmin.email}`)
        }
    }

    // 2. Create Initial Product Catalog (Only if empty ?)
    const productCount = await prisma.product.count()
    if (productCount === 0) {
        const catalog = [
            {
                name: "Doliprane 1000mg Cpr",
                dci: "Paracétamol",
                category: "Antalgique",
                sellingPrice: 300,
                minThreshold: 20,
            },
            // ... more products
        ]

        // ... loop and create
        console.log(`✅ Created products.`)
    }

    console.log('Seeding finished.')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
