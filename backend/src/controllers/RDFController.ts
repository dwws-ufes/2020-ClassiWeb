import { Controller, Get, Inject, PathParams, Response } from '@tsed/common';

import * as $rdf from 'rdflib';

import { AdvertisingService } from '../application/AdvertisingService';

@Controller('/rdf')
export class RDFController {
  @Inject(AdvertisingService)
  private adService: AdvertisingService;

  @Get('/')
  async GetAll(@Response() response: Response) {
    const [ads] = await this.adService.ListAllAds();

    response.set('Content-Type', 'text/xml');
    return this.getRDFFile(ads as any[]);
  }

  @Get('/:id')
  async Get(@PathParams('id') id: string, @Response() response: Response) {
    const ad = await this.adService.GetAdById(id);

    response.set('Content-Type', 'text/xml');
    return this.getRDFFile([ad]);
  }

  private getRDFFile(ads: any[]) {
    const store = $rdf.graph(); // RDF Model

    const myNS = 'http://localhost:8083/rest/rdf/';
    const grNS = 'http://purl.org/goodrelations/v1#';
    store.setPrefixForURI('gr', grNS);

    // Namespaces
    const RDF = $rdf.Namespace('http://www.w3.org/1999/02/22-rdf-syntax-ns#');
    const RDFS = $rdf.Namespace('http://www.w3.org/2000/01/rdf-schema#');
    const XSD = $rdf.Namespace('http://www.w3.org/2001/XMLSchema#');
    const GR = $rdf.Namespace(grNS);

    // Resources
    const grOffering = $rdf.sym(`${grNS}Offering`);
    const grQuantitativeValueInteger = $rdf.sym(`${grNS}QuantitativeValueInteger`);
    const grhasCurrencyValue = $rdf.sym(`${grNS}hasCurrencyValue`);

    // Adicionar instâncias
    ads.forEach((ad) => {
      const adResource = $rdf.sym(`${myNS}${ad.id}`);
      store.add(adResource, RDF('type'), grOffering);
      store.add(adResource, RDFS('label'), ad.title);
      store.add(adResource, RDFS('comment'), ad.description);
      store.add(adResource, GR('name'), ad.title);
      store.add(adResource, GR('description'), ad.description);
      store.add(adResource, GR('category'), ad.category.name);
      store.add(adResource, GR('condition'), !ad.product_state ? 'Novo' : 'Usado');

      store.add(adResource, grQuantitativeValueInteger, $rdf.lit(`${ad.quantity}`, '', XSD('integer')));
      store.add(adResource, grhasCurrencyValue, $rdf.lit(`${ad.price}`, '', XSD('float')));
    });

    const allStatements = store.statementsMatching();
    const serializer = $rdf.Serializer(store);

    return serializer.statementsToXML(allStatements);
  }
}
