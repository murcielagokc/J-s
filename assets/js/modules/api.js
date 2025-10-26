// assets/js/modules/api.js

async function fetchData(url) {
    if (!url || !url.startsWith('http')) throw new Error(`URL no válida o no configurada: ${url}`);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Error de red al cargar desde: ${url}`);
    const tsvText = await response.text();
    return tsvText.trim().split('\n').slice(1).filter(row => row.trim() !== '').map(row => row.split('\t'));
}

export async function loadAllData(urls) {
    const [productsData, typesData, specsData, brandsData, imagesData] = await Promise.all([
        fetchData(urls.products), fetchData(urls.types), fetchData(urls.specs),
        fetchData(urls.brands), fetchData(urls.images)
    ]);
    return { productsData, typesData, specsData, brandsData, imagesData };
}

export function processData({ productsData, typesData, specsData, brandsData, imagesData }) {
    const typesMap = new Map();
    typesData.forEach(row => { if (row && row[0] && row[1]) typesMap.set(row[0].trim(), row[1].trim()); });

    const brandsMap = new Map();
    brandsData.forEach(row => { if (row && row[0] && row[1]) brandsMap.set(row[0].trim(), row[1].trim()); });

    const specsMap = new Map();
    specsData.forEach(row => { if (row && row[0]) { const spec = { name: row[1], value: row[2] }; if (!specsMap.has(row[0])) specsMap.set(row[0], []); specsMap.get(row[0]).push(spec); }});
    
    const imagesMap = new Map();
    imagesData.sort((a, b) => a[2] - b[2]).forEach(row => { if (row && row[0]) { if (!imagesMap.has(row[0])) imagesMap.set(row[0], []); imagesMap.get(row[0]).push(row[1]); }});
    
    return productsData.filter(p => p && p.length >= 7 && p[0]).map(pData => {
        const productImages = imagesMap.get(pData[0]) || [];
        return {
            id: pData[0], name: pData[1], description: pData[2], price: parseFloat(pData[3]) || 0.0,
            imageUrl: productImages.length > 0 ? productImages[0] : (pData[4] || ''), images: productImages,
            category: typesMap.get(pData[5]?.trim()) || 'General', brand: brandsMap.get(pData[6]?.trim()) || 'Sin Marca',
            stock: parseInt(pData[7], 10) || 0, salePrice: parseFloat(pData[8]) || null, groupId: pData[9] || null,
            specifications: specsMap.get(pData[0]) || []
        };
    });
}