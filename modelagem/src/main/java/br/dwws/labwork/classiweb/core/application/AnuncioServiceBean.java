package br.dwws.labwork.classiweb.core.application;

import javax.ejb.EJB;
import javax.ejb.Stateless;

/** TODO: generated by FrameWeb. Should be documented. */
@Stateless
public class AnuncioServiceBean implements AnuncioService {
	/** Serialization id (using default value, change if necessary). */
	private static final long serialVersionUID = 1L;
	
	
	/** TODO: generated by FrameWeb. Should be documented. */
	@EJB
	private AnuncioDAO anuncioDAO;
	
	
	

	
	
	
	/** TODO: generated by FrameWeb. Should be documented. */
	@Override
	public void cadastrarAnuncio(Anuncio anuncio) {
		// FIXME: auto-generated method stub
		return;
	}
	
	/** TODO: generated by FrameWeb. Should be documented. */
	@Override
	public Collection filtrarAnuncios(Collection categorias, Endereco localidade, Float precoMinimo, Float precoMaximo, String titulo, String descricao) {
		// FIXME: auto-generated method stub
		return null;
	}
	
}