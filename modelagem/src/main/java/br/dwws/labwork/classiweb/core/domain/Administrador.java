package br.dwws.labwork.classiweb.core.domain;

import java.util.*;
import java.math.*;
import javax.persistence.*;
import javax.validation.constraints.*;
import br.ufes.inf.nemo.jbutler.ejb.persistence.PersistentObjectSupport;

/** TODO: generated by FrameWeb. Should be documented. */
@Entity
public class Administrador extends PersistentObjectSupport implements Comparable<Administrador> {
	/** Serialization id. */
	private static final long serialVersionUID = 1L;



	/** TODO: generated by FrameWeb. Should be documented. false */
	@NotNull  
	private String matricula;







	/** Getter for matricula. */
	public String getMatricula() {
		return matricula;
	}
	
	/** Setter for matricula. */
	public void setMatricula(String matricula) {
		this.matricula = matricula;
	}








	/** @see java.lang.Comparable#compareTo(java.lang.Object) */
	@Override
	public int compareTo(Administrador o) {
		// FIXME: auto-generated method stub		
		return super.compareTo(o);
	}
}