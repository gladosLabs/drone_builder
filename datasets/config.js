module.exports = {
    // Scraper settings
    scraper: {
        headless: false, // Set to true for production
        delay: {
            min: 2000,
            max: 5000
        },
        timeout: 30000,
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    },

    // GetFPV URLs
    urls: {
        base: 'https://www.getfpv.com',
        motors: 'https://www.getfpv.com/motors.html',
        categories: {
            brushless: 'https://www.getfpv.com/motors/brushless-motors.html',
            brushed: 'https://www.getfpv.com/motors/brushed-motors.html',
            micro: 'https://www.getfpv.com/motors/micro-motors.html',
            // Size categories
            '2204-2206': 'https://www.getfpv.com/motors/brushless-motors/2204-2206.html',
            '2207-2208': 'https://www.getfpv.com/motors/brushless-motors/2207-2208.html',
            '2306-2308': 'https://www.getfpv.com/motors/brushless-motors/2306-2308.html',
            '2407-2408': 'https://www.getfpv.com/motors/brushless-motors/2407-2408.html',
            '2506-2508': 'https://www.getfpv.com/motors/brushless-motors/2506-2508.html',
            '2806-2808': 'https://www.getfpv.com/motors/brushless-motors/2806-2808.html',
            '3008-3010': 'https://www.getfpv.com/motors/brushless-motors/3008-3010.html',
            '3508-3510': 'https://www.getfpv.com/motors/brushless-motors/3508-3510.html',
            '4008-4010': 'https://www.getfpv.com/motors/brushless-motors/4008-4010.html',
            '5008-5010': 'https://www.getfpv.com/motors/brushless-motors/5008-5010.html'
        }
    },

    // Data fields to extract
    fields: {
        required: ['name', 'brand', 'price', 'url'],
        optional: [
            'kv', 'weight', 'shaft_diameter', 'mounting_holes',
            'max_current', 'max_power', 'thrust', 'availability',
            'image_url', 'description', 'specifications'
        ]
    },

    // Output settings
    output: {
        csv: 'getfpv-motors.csv',
        json: 'getfpv-motors.json',
        report: 'scraping-report.json'
    },

    // Selectors for different page elements
    selectors: {
        product: {
            name: '.product-name h1',
            price: '.price-box .price',
            availability: '.availability',
            image: '.product-image img',
            description: '.product-description',
            specifications: '.product-specifications table'
        },
        listing: {
            products: '.product-item a.product-item-link',
            pagination: '.pages .next'
        }
    }
}; 