package br.dwws.labwork.classiweb.core.controller;

import javax.ejb.EJB;
import javax.enterprise.inject.*;
import br.ufes.inf.nemo.jbutler.ejb.controller.JSFController;

/** TODO: generated by FrameWeb. Should be documented. */
@Model
public class AvaliarCompraController extends JSFController {
	/** Serialization id (using default value, change if necessary). */
	private static final long serialVersionUID = 1L;

	
	/** TODO: generated by FrameWeb. Should be documented. */
	@EJB
	private CompraFinalizadaService compraFinalizadaService;
	

	
	/** TODO: generated by FrameWeb. Should be documented. */
	private RankingFeedback avaliacao;
	

	
	/** TODO: generated by FrameWeb. Should be documented. */
	public void enviarAvaliacao() {
		// FIXME: auto-generated method stub
		return;
	}
	
	
	
	/** Getter for avaliacao. */
	public RankingFeedback getAvaliacao() {
		return avaliacao;
	}

	/** Setter for avaliacao. */
	public void setAvaliacao(RankingFeedback avaliacao) {
		this.avaliacao = avaliacao;
	}
	
}